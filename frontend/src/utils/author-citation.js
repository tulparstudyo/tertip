export function resolveAuthorFields(source) {
  const firstName =
    source.authorFirstName?.trim() ||
    source.author_first_name?.trim() ||
    '';
  const lastName =
    source.authorLastName?.trim() ||
    source.author_last_name?.trim() ||
    '';

  if (firstName || lastName) {
    return { firstName, lastName };
  }

  const legacy = source.authors?.trim() || '';
  if (!legacy) {
    return { firstName: '', lastName: '' };
  }

  const commaIndex = legacy.indexOf(',');
  if (commaIndex === -1) {
    return { firstName: '', lastName: legacy };
  }

  return {
    lastName: legacy.slice(0, commaIndex).trim(),
    firstName: legacy.slice(commaIndex + 1).trim(),
  };
}

export function buildAuthorsDisplay({ authorFirstName, authorLastName, authors }) {
  const first = authorFirstName?.trim() || '';
  const last = authorLastName?.trim() || '';
  if (last && first) return `${last}, ${first}`;
  if (last) return last;
  if (first) return first;
  return authors?.trim() || null;
}

/** MLA: Soyadı, Adı */
export function formatAuthorMla(source) {
  const { firstName, lastName } = resolveAuthorFields(source);
  if (lastName && firstName) return `${lastName}, ${firstName}`;
  if (lastName) return lastName;
  if (firstName) return firstName;
  return 'Yazar bilinmiyor';
}

/** APA-style placeholder for future formats: Soyadı, A. */
export function formatAuthorApa(source) {
  const { firstName, lastName } = resolveAuthorFields(source);
  if (lastName && firstName) {
    const initial = firstName.charAt(0).toUpperCase();
    return `${lastName}, ${initial}.`;
  }
  return formatAuthorMla(source);
}

/** Chicago-style placeholder: Soyadı, Adı */
export function formatAuthorChicago(source) {
  return formatAuthorMla(source);
}

export function formatAuthor(source, style = 'mla') {
  switch (style) {
    case 'apa':
      return formatAuthorApa(source);
    case 'chicago':
      return formatAuthorChicago(source);
    default:
      return formatAuthorMla(source);
  }
}
