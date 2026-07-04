<script setup>
import { ref, onMounted, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { IconFileText, IconBook, IconSparkles } from '@tabler/icons-vue';
import { fetchLandingContent } from '@/api/public-client';
import PublicSiteHeader from '@/components/PublicSiteHeader.vue';
import PublicSiteMobileNav from '@/components/PublicSiteMobileNav.vue';
import LandingConveniencesSection from '@/components/landing/LandingConveniencesSection.vue';

const { t } = useI18n();

const loading = ref(true);
const content = ref(null);

const iconMap = {
  'file-text': IconFileText,
  book: IconBook,
  sparkles: IconSparkles,
};

function resolveIcon(name) {
  return iconMap[name] ?? IconFileText;
}

function isInternalLink(link) {
  return link?.startsWith('/');
}

async function loadContent() {
  loading.value = true;
  try {
    content.value = await fetchLandingContent();
  } catch {
    content.value = null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => content.value?.meta?.pageTitle,
  (title) => {
    if (title) document.title = title;
  },
  { immediate: true },
);

onMounted(loadContent);
</script>

<template>
  <div class="min-h-screen bg-white pb-20 md:pb-0">
    <PublicSiteHeader />

    <div v-if="loading" class="flex items-center justify-center py-32 text-slate-500">
      {{ t('common.loading') }}
    </div>

    <template v-else-if="content">
      <!-- Hero -->
      <section id="hero" class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div class="absolute -bottom-32 -left-24 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl" />

        <div class="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
          <p v-if="content.hero.eyebrow" class="text-sm font-medium text-indigo-600 mb-4 tracking-wide uppercase">
            {{ content.hero.eyebrow }}
          </p>
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight max-w-4xl mx-auto">
            {{ content.hero.title }}
          </h1>
          <p class="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {{ content.hero.subtitle }}
          </p>
          <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
            <RouterLink
              v-if="isInternalLink(content.hero.ctaLink)"
              :to="content.hero.ctaLink"
              class="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              {{ content.hero.ctaText }}
            </RouterLink>
            <a
              v-else
              :href="content.hero.ctaLink"
              class="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              {{ content.hero.ctaText }}
            </a>
            <RouterLink
              v-if="isInternalLink(content.hero.secondaryCtaLink)"
              :to="content.hero.secondaryCtaLink"
              class="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:border-indigo-300 hover:text-indigo-700 transition-colors bg-white"
            >
              {{ content.hero.secondaryCtaText }}
            </RouterLink>
            <a
              v-else
              :href="content.hero.secondaryCtaLink"
              class="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:border-indigo-300 hover:text-indigo-700 transition-colors bg-white"
            >
              {{ content.hero.secondaryCtaText }}
            </a>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="py-20 bg-slate-50">
        <div class="max-w-6xl mx-auto px-4">
          <div class="text-center mb-14">
            <h2 class="text-3xl sm:text-4xl font-bold text-slate-900">{{ t('landing.features.title') }}</h2>
            <p class="mt-3 text-slate-600 max-w-xl mx-auto">{{ t('landing.features.subtitle') }}</p>
          </div>
          <div class="grid md:grid-cols-3 gap-8">
            <div
              v-for="(feature, index) in content.features"
              :key="index"
              class="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-5">
                <component :is="resolveIcon(feature.icon)" class="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 class="text-xl font-semibold text-slate-900 mb-2">{{ feature.title }}</h3>
              <p class="text-slate-600 leading-relaxed">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Conveniences -->
      <LandingConveniencesSection
        v-if="content.conveniences?.items?.length"
        :section="content.conveniences"
      />

      <!-- Pricing -->
      <section id="pricing" class="py-20">
        <div class="max-w-6xl mx-auto px-4">
          <div class="text-center mb-14">
            <h2 class="text-3xl sm:text-4xl font-bold text-slate-900">{{ t('landing.pricing.title') }}</h2>
            <p class="mt-3 text-slate-600 max-w-xl mx-auto">{{ t('landing.pricing.subtitle') }}</p>
          </div>
          <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div
              v-for="(plan, index) in content.pricing"
              :key="index"
              class="rounded-2xl p-8 border flex flex-col"
              :class="plan.highlighted
                ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100 ring-2 ring-indigo-500'
                : 'border-slate-200 bg-white'"
            >
              <div class="flex items-baseline gap-1">
                <span class="text-3xl font-bold text-slate-900">{{ plan.price }}</span>
                <span v-if="plan.period" class="text-slate-500">{{ plan.period }}</span>
              </div>
              <h3 class="text-xl font-semibold text-slate-900 mt-2">{{ plan.name }}</h3>
              <p class="text-slate-600 mt-2 text-sm">{{ plan.description }}</p>
              <ul class="mt-6 space-y-2 flex-1">
                <li
                  v-for="(item, fi) in plan.features"
                  :key="fi"
                  class="flex items-center gap-2 text-sm text-slate-700"
                >
                  <span class="text-indigo-600">✓</span>
                  {{ item }}
                </li>
              </ul>
              <RouterLink
                v-if="isInternalLink(plan.ctaLink)"
                :to="plan.ctaLink"
                class="mt-8 block text-center py-3 rounded-xl font-medium transition-colors"
                :class="plan.highlighted
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'border border-slate-300 text-slate-700 hover:border-indigo-300'"
              >
                {{ plan.ctaText }}
              </RouterLink>
              <a
                v-else
                :href="plan.ctaLink"
                class="mt-8 block text-center py-3 rounded-xl font-medium transition-colors"
                :class="plan.highlighted
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'border border-slate-300 text-slate-700 hover:border-indigo-300'"
              >
                {{ plan.ctaText }}
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Bank / Payment -->
      <section id="payment" class="py-20 bg-slate-50">
        <div class="max-w-3xl mx-auto px-4">
          <div class="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm">
            <h2 class="text-2xl font-bold text-slate-900 mb-2">{{ content.bankInfo.title }}</h2>
            <p v-if="content.bankInfo.description" class="text-slate-600 mb-6">
              {{ content.bankInfo.description }}
            </p>
            <dl class="space-y-4">
              <div class="flex flex-col sm:flex-row sm:gap-4">
                <dt class="text-sm font-medium text-slate-500 sm:w-36 shrink-0">{{ t('landing.payment.bank') }}</dt>
                <dd class="text-slate-900 font-medium">{{ content.bankInfo.bankName }}</dd>
              </div>
              <div class="flex flex-col sm:flex-row sm:gap-4">
                <dt class="text-sm font-medium text-slate-500 sm:w-36 shrink-0">{{ t('landing.payment.holder') }}</dt>
                <dd class="text-slate-900 font-medium">{{ content.bankInfo.accountHolder }}</dd>
              </div>
              <div class="flex flex-col sm:flex-row sm:gap-4">
                <dt class="text-sm font-medium text-slate-500 sm:w-36 shrink-0">IBAN</dt>
                <dd class="text-slate-900 font-mono text-sm tracking-wide break-all">{{ content.bankInfo.iban }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-slate-200 py-10">
        <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>{{ content.footer.copyright }}</p>
          <a
            v-if="content.footer.contactEmail"
            :href="`mailto:${content.footer.contactEmail}`"
            class="hover:text-indigo-600 transition-colors"
          >
            {{ content.footer.contactEmail }}
          </a>
        </div>
      </footer>
    </template>

    <PublicSiteMobileNav />
  </div>
</template>
