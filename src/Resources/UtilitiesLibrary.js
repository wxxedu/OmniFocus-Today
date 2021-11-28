(() => {
    var lib = new PlugIn.Library(new Version("1.1"));

lib.nameRe = /【TASK (\d\d)】/

lib.removeNameOrderingLabel = function(task) {
    task.name = task.name.replace(lib.nameRe, "").trim()
}

lib.dateOccursIn = function(dateToCheck, days) {
    var cal = Calendar.current
    var now = new Date()
	var midnightToday = cal.startOfDay(now)
	var dc = cal.dateComponentsFromDate(midnightToday)
	dc.day = dc.day
	var dateBegin = cal.dateFromDateComponents(dc)
	dc = cal.dateComponentsFromDate(midnightToday)
	dc.day = dc.day + days
	var dateEnd = cal.dateFromDateComponents(dc)
    return (dateToCheck >= dateBegin && dateToCheck < dateEnd)
}

lib.dateOccursTomorrow = function(dateToCheck){
	var cal = Calendar.current
	var now = new Date()
	var midnightToday = cal.startOfDay(now)
	var dc = cal.dateComponentsFromDate(midnightToday)
	dc.day = dc.day + 1
	var midnightTomorrow = cal.dateFromDateComponents(dc)
	dc = cal.dateComponentsFromDate(midnightToday)
	dc.day = dc.day + 2
	var dayAfterTomorrow = cal.dateFromDateComponents(dc)
	return (dateToCheck >= midnightTomorrow && dateToCheck < dayAfterTomorrow)
}

lib.dateOccursToday = function(dateToCheck){
	var cal = Calendar.current
	var now = new Date()
	var midnightToday = cal.startOfDay(now)
	var dc = cal.dateComponentsFromDate(midnightToday)
	dc.day = dc.day + 1
	var midnightTomorrow = cal.dateFromDateComponents(dc)
	return ( dateToCheck >= midnightToday && dateToCheck < midnightTomorrow)
}

lib.clearFinishedRepeatedFromToday = function() {
    // let repeatedTaskIds = ["l8mMpB_lsSb"]
    // for (let taskId of repeatedTaskIds) {
    //     let task = Task.byIdentifier(taskId)
    //     if (lib.dateOccursTomorrow(task.dueDate)) {
    //         lib.removeNameOrderingLabel(task)
    //         task.flagged = false
    //     } else {
    //         task.flagged = true
    //     }
    // }
    let tasks = lib.allTasks([lib.taskHasDueDate, lib.taskIsActive])
    for (task of tasks) {
        if (lib.inRepetitionCycle(task) == null) {
            continue
        } else if (lib.inRepetitionCycle(task)) {
            if (lib.dateOccursToday(task.dueDate)) {
                task.flagged = true;
                continue
            } else {
                continue
            }
        } else {
            task.flagged = false
        }
        // if (lib.dateOccursToday(task.dueDate) || task.dueDate < date) {
        //     task.flagged = true
        // } else {
        //     task.flagged = false
        // }
    }
    cleanUp();
}

lib.inRepetitionCycle = function(task) {
    var repetitionLength
    if (task.repetitionRule) {
        repetitionRuleString = task.repetitionRule.ruleString;
        let freqRe = /FREQ=(\w*)/
        repetitionUnitRes = freqRe.exec(repetitionRuleString)
        if (repetitionUnitRes) {
            repetitionUnit = repetitionUnitRes[1]
            if (repetitionUnit == "DAILY") {
                repetitionLength = 1
            } else if (repetitionUnit == "WEEKLY") {
                repetitionLength = 7
            } else if (repetitionUnit == "MONTHLY") {
                repetitionLength = 30
            } else if (repetitionUnit == "YEARLY") {
                repetitionLength = 365
            }
            let intervalRe = /INTERVAL=(\d*)/
            intervalRes = intervalRe.exec(repetitionRuleString)
            if (intervalRes && repetitionLength) {
                repetitionLength = repetitionLength * parseInt(intervalRes[1])
            }
        }
    }
    if (repetitionLength) {
        return lib.dateOccursIn(task.dueDate, repetitionLength)
    } else {
        return null
    }
}



lib.allTasks = function(filterFunctions) {
    var tasks = flattenedTasks
    for (filterFunction of filterFunctions) {
        tasks = tasks.filter(filterFunction)
    }
    return tasks
}

lib.allTasksInTodayView = function() {
    let allTasksForToday = lib.allTasks([lib.taskIsFlagged, lib.taskIsActive]).sort(lib.sortTaskByName)
    return allTasksForToday
}

lib.numberTasks = function() {
    let tasks = lib.allTasksInTodayView()
    var count = 0
    for (var task of tasks) {
        count += 1
        lib.applyNumbering(task, count)
    }
}

lib.hasMatchedThePattern = function(task) {
    if (lib.nameRe.exec(task.name)) {
        return true
    } else {
        return false
    }
}

lib.clearNotTodayTasks = function() {
    let tasks = lib.allTasks([lib.invert(lib.taskIsFlagged), lib.hasMatchedThePattern]) 
    for (task of tasks) {
        task.name = task.name.replace(lib.nameRe, "").trim()
    }
}

lib.applyNumbering = function(task, number) {
    var name = task.name
    numbering = lib.nameRe.exec(name)
    countString = `【TASK ${lib.formatNumber(number)}】`
    if (numbering) {
        name = name.replace(numbering[0], countString)
    } else {
        name = countString + `${name}`
    }
    task.name = name
}

lib.move = function(selection, diff) {
    let tasks = lib.allTasksInTodayView()
    let task = selection.databaseObjects[0]
    var tskMatches = lib.nameRe.exec(task.name)
    let tgtCount = lib.formatNumber(parseInt(tskMatches[1]) - diff)
    let tgtStr = `【TASK ${tgtCount}】`
    let tgtRe = RegExp(tgtStr)
    if (tskMatches) {
        for (tsk of tasks) {
            let tgtMatches = tgtRe.exec(tsk.name)
            if (tgtMatches) {
                task.name = task.name.replace(tskMatches[0], tgtStr)
                tsk.name = tsk.name.replace(tgtStr, tskMatches[0])
                break
            }
        }
    }
}

lib.taskIsFlagged = function(task) {
    return task.flagged
}

lib.taskHasDueDate = function(task) {
    if (task.dueDate || task.repetitionRule) {
        return true
    } else {
        return false
    }
}

lib.taskIsActive = function(task) {
    let parent = task
    let isActive = true
    while (parent) {
        if (parent.completed || parent.taskStatus == Task.Status.Dropped) {
            isActive = false
            break
        }
        parent = parent.parent
    }
    return isActive
}

lib.sortTaskByName = function(a, b) {
    return a.name.localeCompare(b.name)
}

lib.formatNumber = function(num) {
    numStr = `${num}`
        if (numStr.length == 1) {
            return `0${num}`
        } else {
            return numStr
    }
}

lib.invert = function(func) {
    function inverted(value) {
        return !func(value)
    }
    return inverted
}

 return lib
})();