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

export function formatAuthorMla(source) {
  const { firstName, lastName } = resolveAuthorFields(source);
  if (lastName && firstName) return `${lastName}, ${firstName}`;
  if (lastName) return lastName;
  if (firstName) return firstName;
  return 'Yazar bilinmiyor';
}

export function formatAuthor(source, style = 'mla') {
  if (style === 'apa') {
    const { firstName, lastName } = resolveAuthorFields(source);
    if (lastName && firstName) {
      return `${lastName}, ${firstName.charAt(0).toUpperCase()}.`;
    }
  }
  return formatAuthorMla(source);
}
