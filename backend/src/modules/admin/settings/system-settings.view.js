export const systemSettingsView = {
  formatList(items) {
    const groups = {};
    for (const item of items) {
      if (!groups[item.settingGroup]) {
        groups[item.settingGroup] = [];
      }
      groups[item.settingGroup].push(item);
    }

    return { items, groups };
  },
};
