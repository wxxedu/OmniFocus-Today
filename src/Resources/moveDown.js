(() => {
	const action = new PlugIn.Action(function(selection) {
        var utilitiesLib = this.UtilitiesLibrary;
        utilitiesLib.move(selection, -1)
        utilitiesLib.clearNotTodayTasks();
        utilitiesLib.clearFinishedRepeatedFromToday();
        utilitiesLib.numberTasks();
    });
	
	action.validate = function(selection, sender){
		return (selection.window.perspective == Perspective.Custom.byName("Today") && selection.tasks.length == 1 && selection.databaseObjects[0] instanceof Task)
	};

	return action;
})();