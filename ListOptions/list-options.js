$(document).ready(function () {
    let worksheet;
    // This is the sheet we'll use for updating task info
    // the wsName should also be the table name, as it gets passed to the backend 
    const wsName = 'TestSheet';
    const fieldName = 'pra Account Name Equinix Alias'

    tableau.extensions.initializeAsync().then(function () {
        // Initialization succeeded! Get the dashboard's name & log to console
        let dashboard;
        dashboard = tableau.extensions.dashboardContent.dashboard;

        // TODO get data async of currentuser worksheet https://community.tableau.com/thread/278345

        //set the main worksheet to listen to
        for (const ws of dashboard.worksheets) {
            if (ws.name === wsName) {
                worksheet = ws;
            }
        }

        // Add mark selection event listener to our sheet
        worksheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged, onSelectionChanged);

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
        $('#accountInputField').text = "Paste List Here"
        worksheet.applyFilterAsync(fieldName, [], "replace").then((e) => {
            console.log("DONE", e)
        })
    })


    $('#apply').click((e) => {
        e.preventDefault();

        console.log("Submitting form")
        let formInput = $('#accountInputField');
        console.log(formInput)

        let names = formInput.text.split("\n")
        print(names)

        worksheet.applyFilterAsync(fieldName, names, "replace").then((e) => {
            console.log("DONE", e)
        })
    })
});
