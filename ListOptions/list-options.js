$(document).ready( () => {
    let worksheet;
    // This is the sheet we'll use for updating task info
    // the wsName should also be the table name, as it gets passed to the backend 
    const wsName = 'TestSheet';
    const fieldName = 'pra Account Name Equinix Alias'

    tableau.extensions.initializeAsync().then(() => {
        // Initialization succeeded! Get the dashboard's name & log to console
        let dashboard;
        dashboard = tableau.extensions.dashboardContent.dashboard;

        //set the main worksheet to listen to
        for (const ws of dashboard.worksheets) {
            if (ws.name === wsName) {
                worksheet = ws;
            }
        }

        // Add mark selection event listener to our sheet
        console.log('"Extension Initialized. Running in dashboard named ' + dashboard.name);
        console.log('Sheet info: ' + worksheet.name);
    }, function (err) {
        // something went wrong in initialization
        console.log('Error while Initializing: ' + err.toString());
    });

    $('#clear').click((e) => {
        e.preventDefault();
        console.log("Clearing Form")

        // Clear INPUT 
        $('#accountInputField')[0].value = ""
        worksheet.applyFilterAsync(fieldName, [], "replace").then((e) => {
            console.log("DONE", e)
        })
    })


    $('#apply').click((e) => {
        e.preventDefault();

        console.log("Submitting form")
        let formInput = $('#accountInputField')[0];
        console.log(formInput)

        let names = formInput.value.split("\n")
        print(names)

        worksheet.applyFilterAsync(fieldName, names, "replace").then((e) => {
            console.log("DONE", names, e)
        })
    })
});
