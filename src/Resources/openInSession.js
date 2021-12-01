(() => {
    var action = new PlugIn.Action(function(selection) {

        // // let projectMaps = {
        // //     '杂项':'General',
        // //     'MSC1000':'MSC1000',
        // //     'CS1010S':'CS1010S',
        // //     'HS1401':'HS1401',
        // //     'MA1100':'MA1100',
        // //     'GEA1000':'GEA1000',
        // //     'HSA1000':'HSA1000',
        // //     'HSH1000':'HSH1000',
        // // }

        let selected = selection.databaseObjects[0]
        
        // let nameRe = /【TASK (\d\d)】/
        // let taskName = selected.name.replace(nameRe, "").trim()
        let projectName
        let parentFolderName
        let rootFolderName
        let containingProject
        if (selected instanceof Task) {
            containingProject = selected.containingProject
        } else {
            containingProject = selected
        }
        if (containingProject != null) {
            projectName = containingProject.name
            let parentFolder = containingProject.parentFolder
            if (parentFolder != null) {
                parentFolderName = parentFolder.name
                let folder = parentFolder
                while (folder.parent != null) {
                    folder = folder.parent
                }
                rootFolderName = folder.name
            } else {
                rootFolderName = ""
            }
        }
        let minutes = selected.estimatedMinutes
        if (minutes == null) {
            minutes = 25
        }
        let intent = `intent=${encodeURIComponent(projectName)}`
        let category = `&categoryName=${encodeURIComponent(rootFolderName)}`
        let duration = `&duration=${minutes}`
        let urlstr = `session:///start?${intent}${duration}${category}`
        console.log(urlstr)
        let url = URL.fromString(urlstr)
        if (url) {
            url.open()
        } else {
            let alert = new Alert("URL Encoding Failure", `Failed to encode url: ${urlstr}`)
            alert.show()
        }
    });

    // If needed, uncomment, and add a function that returns true if the current selection is appropriate for the action.
    action.validate = function(selection){
        if (selection.databaseObjects.length != 1) {
            return false
        } else {
            let type = selection.databaseObjects[0]
            if (type instanceof Task || type instanceof Project) {
                return true
            } else {
                return false
            }
        }
    };
        
    return action;
})();