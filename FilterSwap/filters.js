$(document).ready(function () {
    console.log("Starting Extension", document.location)
    let filterParameter = "Multiple Filters Parameter"
    let parameterValues = []; 
    let currentParam; 
    let parameterZones = {};


    tableau.extensions.initializeAsync().then(function() {
        tableau.extensions.dashboardContent.dashboard.objects.forEach(function(object){
            console.log(object.name + ":" + object.type + ":" + object.id + ":" + object.isVisible);
            parameterZones[object.name] = object.id;
          });
        tableau.extensions.dashboardContent.dashboard.findParameterAsync(filterParameter).then(function(parameter){
            console.log(parameter);
            currentParam = parameter.currentValue.formattedValue;
            parameter.allowableValues.allowableValues.forEach(function(val){ parameterValues.push(val._formattedValue);})

            parameterValues.forEach(function(val){
                if (val != currentParam)
                    hide(val);
            })
            show(currentParam);

            parameter.addEventListener(tableau.TableauEventType.ParameterChanged, changeParameter)
        })

        })

    function changeParameter(){
        // clears all filters.... 
        // tableau.dashboard.worksheets.forEach(function(worksheet) {
        //     worksheet.getFiltersAsync().then(function(filtersForWorksheet) {
        //         let filterClearPromises = [];
        //         filtersForWorksheet.forEach(function(filter) {
        //             filterClearPromises.push(worksheet.clearFilterAsync(filter.fieldName));
        //         });
        //     });
        // });

        tableau.extensions.dashboardContent.dashboard.findParameterAsync(filterParameter).then(function(parameter){
            console.log(currentParam, parameter.currentValue.formattedValue);
            hide(currentParam);
            currentParam = parameter.currentValue.formattedValue;
            show(currentParam);
        })
    }

    function hide(zoneName){
        let id = parameterZones[zoneName];
        let hideDict = {};
        hideDict[id] = tableau.ZoneVisibilityType.Hide;
        tableau.extensions.dashboardContent.dashboard.setZoneVisibilityAsync(hideDict).then(function() {
            console.log("hide done");
        });
    }

    function show(zoneName){
        let id = parameterZones[zoneName];
        let showDict = {};
        showDict[id] = tableau.ZoneVisibilityType.Show;
        tableau.extensions.dashboardContent.dashboard.setZoneVisibilityAsync(showDict).then(function() {
            console.log("show done");
        });
    }

});
