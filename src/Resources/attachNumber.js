(() => {
    var action = new PlugIn.Action(function(selection) {
        var utilitiesLib = this.UtilitiesLibrary;
        utilitiesLib.clearNotTodayTasks();
        utilitiesLib.clearFinishedRepeatedFromToday();
        utilitiesLib.numberTasks();
        cleanUp();
    });

    // If needed, uncomment, and add a function that returns true if the current selection is appropriate for the action.
    action.validate = function(selection) {
        var utilitiesLib = this.UtilitiesLibrary;
        utilitiesLib.numberTasks();
        return (selection.window.perspective == Perspective.Custom.byName("Today"))
    };
    
    return action;
})();