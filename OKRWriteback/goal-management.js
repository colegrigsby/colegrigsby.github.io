$(document).ready(function () {
    let worksheet;
    // This is the sheet we'll use for updating task info
    // the wsName should also be the table name, as it gets passed to the backend 
    const wsName = 'PRA_OKR';
    const URL = 'https://sv2lxxcntdb01.corp.equinix.com'
    $('#updateItem').hide();

    function onSelectionChanged(marksEvent) {
        const sheetName = marksEvent.worksheet.name;
        marksEvent.getMarksAsync().then(function (selectedMarks) {
            handleSelectedMarks(selectedMarks, sheetName, true);
        });
    }

    function handleSelectedMarks(selectedMarks, sheetName, forceChangeSheet) {
        // If we've got selected marks then process them and show our update button
        if (selectedMarks.data && selectedMarks.data[0].totalRowCount > 0) {
            populateTable(selectedMarks.data[0]);
            $('#updateItem').show();
        } else {
            resetTable();
            $('#updateItem').hide();
        }
    }

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

    function resetTable() {
        $('#data_table tr').remove();
        var headerRow = $('<tr/>');
        headerRow.append('<th>Click on an OKR to update the status</th>');

        $('#data_table').append(headerRow);
        $('#deleteOKR').attr('hidden', true)

    }

    function populateTable(dt) {
        // console.log(dt)
        $('#deleteOKR').attr('hidden', false)
        $('#data_table tr').remove();
        var headerRow = $('<tr/>');
        headerRow.append('<th>Name</th>');
        headerRow.append('<th>Quarter</th>');
        headerRow.append('<th>Status</th>');
        headerRow.append('<th>OKR</th>');
        $('#data_table').append(headerRow);

        let nameIndex, quarterIndex, statusIndex, OKRIndex, rowIndex, quarterOptions;

        // get our column indexes
        for (let c of dt.columns) {
            switch (c.fieldName) {
                case 'Name':
                    nameIndex = c.index;
                    break;
                case 'Quarter':
                    quarterIndex = c.index;
                    break;
                case 'Status':
                    statusIndex = c.index;
                    break;
                case 'OKR':
                    OKRIndex = c.index;
                    break;
                case 'RowID':
                    rowIndex = c.index;
                    break;
                default:
                    break;
            }
        }

        //quarterOptions = [];
        // add our rows for the selected marks
        dt.data.forEach(function (item) {
            const rowID = item[rowIndex].formattedValue;
            let dataRow = $('<tr/>');
            dataRow.append('<td><input type="text" class="form-control" "size="8" id="row_' + rowID + '_Name" value="' + item[nameIndex].formattedValue + '"/></td>');
            dataRow.append('<td><input type="text" class="form-control" "size="8" id="row_' + rowID + '_Quarter" value="' + item[quarterIndex].formattedValue + '" /></td>');

            let selectedOption = "";
            ["Completed", "On Track", "At Risk", "Dropped"].forEach(function (val) {
                selectedOption += ('<option' + ((val == item[statusIndex].formattedValue) ? ' selected' : '') + '>' + val + '</option>')
            });
            dataRow.append('<td><select class="form-control" id="row_' + rowID + '_Status">' + selectedOption + '</select></td>')
            dataRow.append('<td><textarea type="text" class="form-control" size="8" id="row_' + rowID + '_OKR">' + item[OKRIndex].formattedValue + '</textarea></td>');
            $('#data_table').append(dataRow);
        });
    }

    $('#deleteOKR').click((e) => {
        e.preventDefault();

        let formInputs = $('form#projectTasks :input[type="text"],select,textarea');
        let row_id = formInputs[0].id.split('_')[1]

        $.ajax({ type: 'DELETE', url: URL + '/delete/PRA_OKR/' + row_id })
            .done((e) => {
                // console.log(e);
                worksheet.getDataSourcesAsync().then(function (dataSources) {
                    dataSources[0].refreshAsync();
                })
            })
    })

    $('#newOKR').click((e) => {
        $('#updateItem').show();
        populateTable({
            columns: [
                { fieldName: "Name", "index": 0 },
                { fieldName: "Quarter", "index": 1 },
                { fieldName: "Status", "index": 2 },
                { fieldName: "OKR", "index": 3 },
                { fieldName: "RowID", "index": 4 }
            ],
            data: [
                [
                    { formattedValue: "" },
                    { formattedValue: "" },
                    { formattedValue: "On Track" },
                    { formattedValue: "" },
                    { formattedValue: -1 }
                ]
            ]
        })
    })

    $('form').submit(function (event) {
        event.preventDefault();
        let row_id, col
        let formInputs = $('form#projectTasks :input[type="text"],select,textarea');
        let postData = {};

        formInputs.each(() => {
            let c = $(this);
            row_id = c[0].id.split('_')[1]
            col = c[0].id.split('_')[2]
            postData[col] = c[0].value;
        });

        postData['row_id'] = row_id;

        console.log(postData)
        // Post it
        $.ajax({
            type: 'POST',
            url: URL + '/update/PRA_OKR',
            data: JSON.stringify(postData),
            contentType: 'application/json'
        }).done((r) => {
            worksheet.getDataSourcesAsync().then(function (dataSources) {
                dataSources[0].refreshAsync();
            })
        });
    });
});
