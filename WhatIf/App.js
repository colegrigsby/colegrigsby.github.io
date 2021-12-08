import React, { Component } from 'react';
import './app.css';
import { ToggleSwitch, Stepper, Button } from '@tableau/tableau-ui';




export default class App extends Component {
    constructor(props) {
        super(props);
        this.data_sheet = null;
        this.state = {
            sheets: [],
            dashboard: "",
            variables: [],
            months: 12,
            // add_rate: 0,
            // add_rate_start: 0,
            // churn_rate: 0,
            // churn_rate_start: 0
        };
    }

    componentDidMount() {
        tableau.extensions.initializeAsync().then(() => {
            const sheetNames = tableau.extensions.dashboardContent.dashboard.worksheets.map(worksheet => worksheet.name);
            const dashboardName = tableau.extensions.dashboardContent.dashboard.name;
            const data = tableau.extensions.dashboardContent.dashboard.worksheets.find(worksheet => worksheet.name === "Variables Data")
            this.data_sheet = data;
            // set up initial values for variable objects
            data.getSummaryDataAsync().then(marks => {
                // Get the first DataTable for our selected marks (usually there is just one)
                const worksheetData = marks;
                console.log(marks)

                // Map our data into the format which the data table component expects it
                const rows = worksheetData.data.map(row => row.map(cell => cell.value));
                const headers = worksheetData.columns.map(column => column.fieldName);
                let variables = rows.map(row => Object.assign(...row.map((val, i) => ({ [headers[i]]: val }))));
                console.log(variables)
                variables.forEach(v => v['coef_calc'] = v['Coef'])
                variables.forEach(v => v['add_start'] = v['Add'])
                variables.forEach(v => v['churn_start'] = v['Churn'])

                //TODO set all the coef params to their coef calc value

                this.setState({
                    sheets: sheetNames,
                    dashboard: dashboardName,
                    variables: variables
                })
            });

        });

    }

    //Handle dependent variables
    // update variables ... 

    updateVariable(variable, new_coef) {
        let newStateVars = this.state.variables.slice()

        let updateVar = newStateVars.filter(f => variable == f.Variable)[0]
        // let index = newStateVars.indexOf(updateVar)
        // updateVar = {...updateVar}

        updateVar['coef_calc'] = new_coef

        // newStateVars[index] = updateVar;
        console.log(newStateVars)

        this.setState({
            variables: newStateVars
        })

        const param_name = variable + " Parameter"
        // Update Parameter in Tableau findParameterAsync then changeValueAsync 
        this.data_sheet.findParameterAsync(param_name).then(parameter => {
            if (!parameter)
                console.log("cannot find ", param_name)
            else
                parameter.changeValueAsync(new_coef)
        })

    }

    updateChurn(value, t = 'Churn') {
        let mult = value - this.state.add_rate_start;
        if (t == 'Churn')
            mult = this.state.churn_rate_start - value;

        let coef = this.state.variables.filter(f => 'pra CC Count' == f.Variable)[0]['coef_calc']
        this.updateVariable('pra CC Count', coef + mult)
        console.log(value, t)
        if (t == 'Churn')
            this.setState({
                churn_rate: value
            })
        else
            this.setState({
                add_rate: value
            })
        // TODO adjust the product growth rate by the % up or down here. 
    }

    render() {
        console.log('render')
        const variables = this.state.variables.map(v => <Variable key={v.Variable} var_coef={v.coef_calc} variable={v} updateVariable={(v, nc) => this.updateVariable(v, nc)}></Variable>)
        const months = this.state.months;
        const add_rate = this.state.add_rate;
        const churn_rate = this.state.churn_rate;
        return (
            <div>
                <h3>Adjust Growth</h3>
                <table>
                    <tbody>
                        <tr>
                            <th>Variable</th>
                            <th>Gross Add</th>
                            <th>Gross Churn</th>
                            <th>Monthly % Growth</th>
                            <th>Monthly Growth</th>
                            {/* <th>{months} Month % Change</th> */}
                            <th>{months} Month Forecast</th>
                        </tr>
                        {variables}
                    </tbody>
                </table>
                {/* <div>
                    <Stepper className='num-input' floatingPoint step={.01} pageSteps={1} value={add_rate} onValueChange={value => this.updateChurn(value, 'Add')} />
                    <Stepper className='num-input' floatingPoint step={.01} pageSteps={1} value={churn_rate} onValueChange={value => this.updateChurn(value)} />
                </div> */}
            </div>
        );
    }
}



class Variable extends Component {
    constructor(props) {
        super(props)
        this.variable = props.variable;
        this.updateVariable = props.updateVariable;
        this.mult = this.variable.Rate == 'Rate' ? 100 : 1; 
        this.state = {
            // variable: props.variable
            percent: 0,
            monthly: 0,
            longpercent: 0,
            longtarget: 0,
            enabled: true,
            changed: false
        }
    }



    componentDidMount() {
        this.displayValues()
    }

    displayValFormat(val) {
        return parseFloat(val.toFixed(2))
    }


    displayValues() {
        const rate = this.variable.Rate; 
        const coef = this.variable.coef_calc;
        const start = this.variable.Start;
        const ext = coef * 12 + start;
        const mult = this.mult; 
        let add = 'N/A';
        let churn = 'N/A'; 
        

        console.log(this.variable.Add)
        if (this.variable.Add != '%null%') {
            add = this.displayValFormat(this.variable.Add * mult)
        }
        if (this.variable.Churn != '%null%') {
            churn = this.displayValFormat(this.variable.Churn * mult)
        }


        this.setState({
            add: add,
            churn: churn,
            percent: this.displayValFormat(coef / start * 100),
            monthly: this.displayValFormat(coef),
            longpercent: this.displayValFormat((ext / start - 1) * 100),
            longtarget: this.displayValFormat(ext)
        })

    }

    reset() {
        //set coef_calc to Coef and update parent coef_calc 
        this.updateVariable(this.variable.Variable, this.variable.Coef)
        this.variable.Add = this.variable.add_start;
        this.variable.Churn = this.variable.churn_start; 
        this.displayValues()
        this.setState({
            changed: false
        })
    }

    updateInput(field, value) {
        // TODO recalculate coef_calc ==> update parent state
        console.log(field, value)
        const start = this.variable.Start;
        const growth = this.state.percent;
        const mult = this.mult; 

        let new_coef = 0

        switch (field) {
            case 'percent':
                new_coef = (value / 100) * start
                break;
            case 'monthly':
                new_coef = value
                break;
            case 'add':
                if (mult == 1) {

                }
                else {
                    const add_start = this.variable.Add * 100;
                    new_coef = (growth + (value - add_start))/100 * start;
                }
                this.variable.Add = value/mult; 
                break; 
            case 'churn':
                const churn_start = this.variable.Churn * 100;
                new_coef = (growth + (value - churn_start))/100 * start;
                this.variable.Churn = value/mult; 
                break; 
            case 'longpercent':
                new_coef = (value / 100) * start / 12; // TODO make this handle cagr 
                break;
            case 'longtarget':
                new_coef = (value - start) / 12; // TODO dynamic # months 
                break;
            // case 
        }

        this.updateVariable(this.variable.Variable, new_coef)
        this.setState({
            changed: true
        })
        this.displayValues()
        // let newState = this.state; 
        // newState[field] = value;
        // this.setState(newState)


    }


    render() {
        const start = this.variable.Start;
        const varname = this.variable.Variable;
        const rate = this.variable.Rate;


        const fields = [
            ['add', rate, 1/this.mult],
            ['churn', rate, -1/this.mult],
            ['percent', 'Monthly %', .01],
            ['monthly', 'Monthly Change', 1],
            // ['longpercent', '12 Month %', .01],
            ['longtarget', '12 Month Value', 1]
        ]

        const inputs = fields.map(f => {
            const field = f[0]
            const name = f[1]
            const step = f[2]
            if (this.state[field] != 'N/A')
                return (
                    // TODO highlight if it has changed 
                    <td className="num-cell" key={varname + field} >
                        <Stepper className='num-input' floatingPoint step={step} pageSteps={1} value={this.state[field]} onValueChange={value => this.updateInput(field, value)} />
                        {/* <label> -- </label> */}
                    </td>
                )
            else
                return (<td className="num-cell" key={varname + field}></td>)
        })

        const var_class = "var-cell" + (this.state.changed ? " changed" : "")

        const button = this.state.changed ? <Button kind='outline' key={this.variable.Variable} onClick={() => this.reset()}>Reset</Button> : <Button kind='outline' disabled key={this.variable.Variable} onClick={() => this.reset()}>Reset</Button>

        return (
            <tr>
                <td className={var_class}>{this.variable.Variable} <br /> {start.toFixed(0)}</td>

                {inputs}

                <td className="reset">{button}</td>

                {/* <td className="switch"><ToggleSwitch></ToggleSwitch></td> */}
            </tr>
        )


    }


}