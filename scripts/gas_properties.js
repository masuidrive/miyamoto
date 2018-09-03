// KVS
// でも今回は使ってないです

loadGASProperties = function (exports) {
  var GASProperties = function() {
     this.properties = PropertiesService.getScriptProperties();
  };

  const values = {
    master_folder_id: () => DriveApp.getFileById(ScriptApp.getScriptId()).getParents().next().getId(),
    employees_folder_id: () => {
      const master_folder_id = DriveApp.getFileById(ScriptApp.getScriptId()).getParents().next().getId();
      const employees_fi = DriveApp.searchFolders(`"${master_folder_id}" in parents and title = "Employees"`);
      return employees_fi.hasNext()
        ? employees_fi.next().getId()
        : this.master_folder.createFolder('Employees')
          .setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.NONE)
          .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.NONE)
          .setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.VIEW)
          .setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW)
          .getId();
    },
    users: () => {
      const master_folder_id = DriveApp.getFileById(ScriptApp.getScriptId()).getParents().next().getId();
      const employees_fi = DriveApp.searchFolders(`"${master_folder_id}" in parents and title = "Employees"`);
      const employees_folder_id = employees_fi.next().getId();
      const employeesSpreadsheets = DriveApp.searchFiles(
        `"${employees_folder_id}" in parents and mimeType = "${MimeType.GOOGLE_SHEETS}"`
      );
      const users = {};
      while (employeesSpreadsheets.hasNext()) {
        const ss = employeesSpreadsheets.next();
        users[ss.getName()] = ss.getId();
      }
      return JSON.stringify(users);
    }
  };

  GASProperties.prototype.get = function(key) {
    let val = this.properties.getProperty(key);
    if (!(key in values) || val !== null) return val;

    val = values[key]();
    this.set(key, val);
    return val
  };

  GASProperties.prototype.set = function(key, val) {
    this.properties.setProperty(key, val);
    return val;
  };

  return GASProperties;
};

if(typeof exports !== 'undefined') {
  exports.GASProperties = loadGASProperties();
}
