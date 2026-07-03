import { asyncHandler } from '../../../shared/utils/async-handler.util.js';
import { sendSuccess, sendError } from '../../../shared/utils/api-response.util.js';
import {
  createProjectWorkspace,
  ensureProjectGoogleDoc,
  getDriveClientForUser,
  isDriveNotFoundError,
} from '../../../shared/services/google-drive.service.js';
import { syncProjectToGoogleDoc, projectHasSyncableContent, extractGoogleDocsError } from '../../../shared/services/google-docs.service.js';
import {
  collectSectionsForGoogleDoc,
  resolveProjectSectionColumn,
  resolveSectionContent,
} from '../../../shared/constants/project-sections.constants.js';
import { buildDefaultSectionDoc, buildThesisKapakDoc, buildOzDocFromParagraphs, buildAbstractDocFromParagraphs, parseGeneratedParagraphs, prepareOzSourceText } from '../../../shared/constants/project-section-defaults.js';
import { runGemini, localeInstruction } from '../../../shared/services/gemini.service.js';
import { tiptapJsonToPlainText } from '../../../shared/services/google-docs.service.js';
import { aiModel } from '../ai/ai.model.js';
import {
  getProjectContext,
  pickProjectMetadata,
  validateProjectMetadata,
} from '../../../shared/constants/project-metadata.constants.js';
import { projectModel } from './project.model.js';
import { projectView } from './project.view.js';
import { respondToGoogleError } from '../../../shared/utils/google-error.util.js';
import { handleAiError } from '../../../shared/utils/ai-error.util.js';
import {
  PROJECT_SECTION_SLUGS,
} from '../../../shared/constants/project-sections.constants.js';
import {
  collectFootnoteSourceIds,
  uniqueSourceIds,
  formatTurkishBibliographyEntry,
  sortBibliographyEntries,
  buildKaynakcaDocFromEntries,
} from '../../../shared/utils/turkish-bibliography.util.js';
import { libraryModel } from '../library/library.model.js';
import { libraryView } from '../library/library.view.js';

const VALID_TYPES = ['thesis', 'article', 'proceeding', 'book', 'proposal', 'other'];

export const projectController = {
  listProjects: asyncHandler(async (req, res) => {
    const rows = await projectModel.findAllByUserId(req.user.id);
    sendSuccess(res, {
      message: req.t('user.project.list.success'),
      data: projectView.formatProjectList(rows),
    });
  }),

  getProjectById: asyncHandler(async (req, res) => {
    const access = await projectModel.findAccessibleProject(
      Number(req.params.projectId),
      req.user.id,
    );

    if (!access) {
      return sendError(res, {
        status: 404,
        message: req.t('user.project.get.notFound'),
      });
    }

    sendSuccess(res, { data: projectView.formatProject(access.project) });
  }),

  createProject: asyncHandler(async (req, res) => {
    const { title, projectType = 'article', metadata: rawMetadata = {} } = req.body;

    if (!title?.trim()) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.create.missingTitle'),
      });
    }

    if (!VALID_TYPES.includes(projectType)) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.create.invalidType'),
      });
    }

    const metadata = pickProjectMetadata(projectType, rawMetadata);
    const validation = validateProjectMetadata(projectType, metadata);

    if (!validation.valid) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.create.missingMetadata'),
      });
    }

    try {
      const driveWorkspace = await createProjectWorkspace(req.user.id, title.trim());
      const row = await projectModel.insert(req.user.id, {
        title: title.trim(),
        projectType,
        googleDocsFileId: driveWorkspace.googleDocsFileId,
        googleDriveFolderId: driveWorkspace.googleDriveFolderId,
        metadata,
      });

      sendSuccess(res, {
        status: 201,
        message: req.t('user.project.create.success'),
        data: projectView.formatProject(row),
      });
    } catch (err) {
      if (await respondToGoogleError(req, res, err, req.user.id)) return;
      throw err;
    }
  }),

  updateProject: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const existing = await projectModel.findByIdAndUserId(projectId, req.user.id);

    if (!existing) {
      return sendError(res, {
        status: 404,
        message: req.t('user.project.get.notFound'),
      });
    }

    const projectType = req.body.projectType ?? existing.project_type;

    if (!VALID_TYPES.includes(projectType)) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.create.invalidType'),
      });
    }

    const title = req.body.title?.trim() ?? existing.title;

    if (!title) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.create.missingTitle'),
      });
    }

    const metadata =
      req.body.metadata !== undefined
        ? pickProjectMetadata(projectType, req.body.metadata)
        : existing.metadata ?? {};

    const validation = validateProjectMetadata(projectType, metadata);

    if (!validation.valid) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.create.missingMetadata'),
      });
    }

    const row = await projectModel.updateById(projectId, req.user.id, {
      title,
      projectType,
      metadata,
    });

    if (req.body.refreshKapak !== false) {
      const kapakDoc = buildDefaultSectionDoc('kapak', getProjectContext(row));
      await projectModel.saveSectionContent(projectId, req.user.id, 'kapak', kapakDoc);
    }

    sendSuccess(res, {
      message: req.t('user.project.update.success'),
      data: projectView.formatProject(row),
    });
  }),

  deleteProject: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const deleted = await projectModel.deleteById(projectId, req.user.id);

    if (!deleted) {
      return sendError(res, {
        status: 404,
        message: req.t('user.project.get.notFound'),
      });
    }

    sendSuccess(res, { message: req.t('user.project.delete.success') });
  }),

  generateKapak: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const access = await projectModel.findAccessibleProject(projectId, req.user.id);

    if (!access) {
      return sendError(res, {
        status: 404,
        message: req.t('user.project.get.notFound'),
      });
    }

    if (!access.isOwner) {
      return sendError(res, {
        status: 403,
        message: req.t('user.project.content.readOnly'),
      });
    }

    if (access.project.project_type !== 'thesis') {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.kapak.thesisOnly'),
      });
    }

    const metadata = access.project.metadata ?? {};
    const validation = validateProjectMetadata('thesis', metadata);

    if (!validation.valid) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.create.missingMetadata'),
      });
    }

    const kapakDoc = buildThesisKapakDoc(getProjectContext(access.project));
    await projectModel.saveSectionContent(projectId, req.user.id, 'kapak', kapakDoc);

    sendSuccess(res, {
      message: req.t('user.project.kapak.generated'),
      data: { content: kapakDoc },
    });
  }),

  generateOz: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const access = await projectModel.findAccessibleProject(projectId, req.user.id);

    if (!access) {
      return sendError(res, {
        status: 404,
        message: req.t('user.project.get.notFound'),
      });
    }

    if (!access.isOwner) {
      return sendError(res, {
        status: 403,
        message: req.t('user.project.content.readOnly'),
      });
    }

    const bodyContent = projectModel.getSectionContent(access.project, 'body');
    const { text: bodyText, truncated } = prepareOzSourceText(
      tiptapJsonToPlainText(bodyContent ?? { type: 'doc', content: [] }),
    );

    if (!bodyText) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.oz.emptyBody'),
      });
    }

    const locale = req.locale ?? 'tr';
    const projectType = access.project.project_type ?? 'article';
    const systemInstruction = [
      `You are an elite academic editor specializing in Turkish thesis and research writing.`,
      `Write an abstract (öz) that summarizes the main text of a ${projectType}.`,
      localeInstruction(locale),
      truncated ? 'The source text is truncated; summarize the available content as faithfully as possible.' : '',
      'Requirements:',
      '- At least 3 paragraphs.',
      '- At most one A4 page (about 250–350 words).',
      '- Rigorous academic tone; preserve the source meaning.',
      '- Do not add a title or heading.',
      '- Output only paragraph text, separated by a single blank line between paragraphs.',
      '- No markdown, bullet lists, or meta commentary.',
    ]
      .filter(Boolean)
      .join(' ');

    try {
      const { text, tokensUsed } = await runGemini({
        systemInstruction,
        parts: [{ text: bodyText }],
      });
      await aiModel.consumeTokens(req.user.id, tokensUsed);

      const paragraphs = parseGeneratedParagraphs(text);
      if (paragraphs.length < 3) {
        return sendError(res, {
          status: 502,
          message: req.t('user.project.oz.generationFailed'),
        });
      }

      const ozDoc = buildOzDocFromParagraphs(paragraphs);
      await projectModel.saveSectionContent(projectId, req.user.id, 'oz', ozDoc);

      sendSuccess(res, {
        message: req.t('user.project.oz.generated'),
        data: { content: ozDoc },
      });
    } catch (err) {
      if (handleAiError(err, req, res)) return;
      console.error('generateOz failed:', err);
      throw err;
    }
  }),

  generateAbstract: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const access = await projectModel.findAccessibleProject(projectId, req.user.id);

    if (!access) {
      return sendError(res, {
        status: 404,
        message: req.t('user.project.get.notFound'),
      });
    }

    if (!access.isOwner) {
      return sendError(res, {
        status: 403,
        message: req.t('user.project.content.readOnly'),
      });
    }

    const ozContent = projectModel.getSectionContent(access.project, 'oz');
    const ozText = tiptapJsonToPlainText(ozContent ?? { type: 'doc', content: [] }).trim();

    if (!ozText) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.abstract.emptyOz'),
      });
    }

    const projectType = access.project.project_type ?? 'article';
    const systemInstruction = [
      `You are an elite academic translator specializing in Turkish-to-English scholarly writing.`,
      `Translate the Turkish abstract (öz) of a ${projectType} into English.`,
      'Respond strictly in English.',
      'Requirements:',
      '- Preserve the original meaning and academic tone.',
      '- Keep the same paragraph structure as the source.',
      '- Do not add a title or heading.',
      '- Output only paragraph text, separated by a single blank line between paragraphs.',
      '- No markdown, bullet lists, or meta commentary.',
    ].join(' ');

    try {
      const { text, tokensUsed } = await runGemini({
        systemInstruction,
        parts: [{ text: ozText }],
      });
      await aiModel.consumeTokens(req.user.id, tokensUsed);

      const paragraphs = parseGeneratedParagraphs(text);
      if (!paragraphs.length) {
        return sendError(res, {
          status: 502,
          message: req.t('user.project.abstract.generationFailed'),
        });
      }

      const abstractDoc = buildAbstractDocFromParagraphs(paragraphs);
      await projectModel.saveSectionContent(projectId, req.user.id, 'abstract', abstractDoc);

      sendSuccess(res, {
        message: req.t('user.project.abstract.generated'),
        data: { content: abstractDoc },
      });
    } catch (err) {
      if (handleAiError(err, req, res)) return;
      console.error('generateAbstract failed:', err);
      throw err;
    }
  }),

  generateKaynakca: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const access = await projectModel.findAccessibleProject(projectId, req.user.id);

    if (!access) {
      return sendError(res, {
        status: 404,
        message: req.t('user.project.get.notFound'),
      });
    }

    if (!access.isOwner) {
      return sendError(res, {
        status: 403,
        message: req.t('user.project.content.readOnly'),
      });
    }

    const collectedIds = [];
    for (const section of PROJECT_SECTION_SLUGS) {
      if (section === 'kaynakca') continue;
      const doc = projectModel.getSectionContent(access.project, section);
      if (doc) collectedIds.push(...collectFootnoteSourceIds(doc));
    }

    const sourceIds = uniqueSourceIds(collectedIds);
    if (!sourceIds.length) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.kaynakca.emptyFootnotes'),
      });
    }

    const allSources = libraryView.formatSourceList(
      await libraryModel.findAllByUserId(req.user.id),
    );
    const sourceMap = new Map(allSources.map((source) => [source.id, source]));

    const entries = sortBibliographyEntries(
      sourceIds
        .map((id) => sourceMap.get(id))
        .filter(Boolean)
        .map((source) => formatTurkishBibliographyEntry(source)),
    );

    if (!entries.length) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.kaynakca.sourcesNotFound'),
      });
    }

    const kaynakcaDoc = buildKaynakcaDocFromEntries(entries);
    await projectModel.saveSectionContent(projectId, req.user.id, 'kaynakca', kaynakcaDoc);

    sendSuccess(res, {
      message: req.t('user.project.kaynakca.generated'),
      data: { content: kaynakcaDoc },
    });
  }),

  getContent: asyncHandler(async (req, res) => {
    req.params.section = 'body';
    return projectController.getSection(req, res);
  }),

  saveContent: asyncHandler(async (req, res) => {
    req.params.section = 'body';
    return projectController.saveSection(req, res);
  }),

  getSection: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const section = req.params.section;

    if (!resolveProjectSectionColumn(section)) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.section.invalid'),
      });
    }

    const access = await projectModel.findAccessibleProject(projectId, req.user.id);

    if (!access) {
      return sendError(res, {
        status: 404,
        message: req.t('user.project.get.notFound'),
      });
    }

    let content = projectModel.getSectionContent(access.project, section);

    if (!content && access.isOwner) {
      const defaultDoc = buildDefaultSectionDoc(section, getProjectContext(access.project));
      await projectModel.saveSectionContent(projectId, req.user.id, section, defaultDoc);
      content = defaultDoc;
    } else if (!content) {
      content = resolveSectionContent(access.project, section);
    }

    sendSuccess(res, {
      data: {
        section,
        content,
        updatedAt: access.project.updated_at,
        canEdit: access.canEdit,
      },
    });
  }),

  saveSection: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const section = req.params.section;

    if (!resolveProjectSectionColumn(section)) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.section.invalid'),
      });
    }

    const access = await projectModel.findAccessibleProject(projectId, req.user.id);

    if (!access) {
      return sendError(res, {
        status: 404,
        message: req.t('user.project.get.notFound'),
      });
    }

    if (!access.isOwner) {
      return sendError(res, {
        status: 403,
        message: req.t('user.project.content.readOnly'),
      });
    }

    const { content } = req.body;
    if (!content || typeof content !== 'object') {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.content.invalid'),
      });
    }

    const row = await projectModel.saveSectionContent(
      projectId,
      req.user.id,
      section,
      content,
    );

    if (!row) {
      return sendError(res, {
        status: 404,
        message: req.t('user.project.get.notFound'),
      });
    }

    sendSuccess(res, {
      message: req.t('user.project.section.save.success'),
      data: {
        section,
        updatedAt: row.updated_at,
      },
    });
  }),

  syncGoogleDoc: asyncHandler(async (req, res) => {
    const projectId = Number(req.params.projectId);
    const access = await projectModel.findAccessibleProject(projectId, req.user.id);

    if (!access) {
      return sendError(res, {
        status: 404,
        message: req.t('user.project.get.notFound'),
      });
    }

    if (!access.isOwner) {
      return sendError(res, {
        status: 403,
        message: req.t('user.project.content.readOnly'),
      });
    }

    if (!access.project.google_docs_file_id) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.sync.noDoc'),
      });
    }

    const sectionDocs = collectSectionsForGoogleDoc(access.project);

    if (!projectHasSyncableContent(sectionDocs)) {
      return sendError(res, {
        status: 400,
        message: req.t('user.project.sync.empty'),
      });
    }

    try {
      let googleDocsFileId = access.project.google_docs_file_id;
      let docRecreated = false;
      const { client, drive } = await getDriveClientForUser(req.user.id);

      const ensureDoc = async () => {
        const workspace = await ensureProjectGoogleDoc(
          req.user.id,
          {
            title: access.project.title,
            googleDocsFileId,
            googleDriveFolderId: access.project.google_drive_folder_id,
          },
          { drive },
        );

        if (
          workspace.recreated ||
          workspace.googleDocsFileId !== googleDocsFileId ||
          workspace.googleDriveFolderId !== access.project.google_drive_folder_id
        ) {
          await projectModel.updateDriveWorkspace(projectId, req.user.id, workspace);
          googleDocsFileId = workspace.googleDocsFileId;
          docRecreated = docRecreated || workspace.recreated;
        }
      };

      const runSync = async () => {
        await syncProjectToGoogleDoc(req.user.id, googleDocsFileId, sectionDocs, { client });
      };

      await ensureDoc();
      try {
        await runSync();
      } catch (err) {
        if (isDriveNotFoundError(err.cause ?? err)) {
          googleDocsFileId = null;
          await ensureDoc();
          await runSync();
          docRecreated = true;
        } else {
          throw err;
        }
      }

      sendSuccess(res, {
        message: docRecreated
          ? req.t('user.project.sync.recreated')
          : req.t('user.project.sync.success'),
      });
    } catch (err) {
      if (err.message === 'NO_CONTENT_TO_SYNC') {
        return sendError(res, {
          status: 400,
          message: req.t('user.project.sync.empty'),
        });
      }
      if (await respondToGoogleError(req, res, err, req.user.id)) return;
      console.error('Google Docs sync failed:', extractGoogleDocsError(err.cause ?? err), err);
      const detail = extractGoogleDocsError(err.cause ?? err);
      return sendError(res, {
        status: 502,
        message: `${req.t('user.project.sync.failed')} ${detail}`,
      });
    }
  }),
};
