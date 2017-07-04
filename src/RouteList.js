import React, {Component} from 'react';
import Select from 'react-select';
import PropTypes from 'prop-types';
import axios from 'axios';
import './RouteList.css';

let options = [];

class RouteList extends Component{
    constructor(){
        super();        
        this.state = {
            allRoutes: [],
            selectedRoutes: []            
        };
        this.onRouteChange = this.onRouteChange.bind(this);
    }    
    
    componentDidMount(){
        //Retrieve the SF-Muni route list        
        axios.get('http://webservices.nextbus.com/service/publicJSONFeed?command=routeList&a=sf-muni')
            .then(response => {
                response.data.route.map(route =>
                    options.push({
                        label: route.tag,
                        value: route.title
                    })
                )
                this.setState({ 
                    allRoutes: response.data.route 
                });
            })
            .catch((error) => {
                console.log(error);
            });            
    }

    componentDidUpdate(prevProps, prevState){
        if(prevState.selectedRoutes !== this.state.selectedRoutes){            
            let isAllUnselected = true;
            let html = '<table><caption><h3>Selected Routes:</h3></caption>' + 
                            '<tr><th>Route</th><th>Color</th></tr>';
            for(var tags in this.state.selectedRoutes){                
                if(this.state.selectedRoutes[tags] === true){
                    html += '<tr><td>' + tags + '</td><td style="background-color:' + this.getHexColorFromString(tags) + '"></td></tr>';
                    isAllUnselected = false;
                }
            }
            html += '</table>';
            this.refs.selected_routes.innerHTML = (!isAllUnselected) ? html : '<h3>All routes selected</h3>';            
            this.props.onChange(this.state.selectedRoutes);
        }
    }

    getHexColorFromString(str){        
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        var colour = '#';
        for (i = 0; i < 3; i++) {
            var value = (hash >> (i * 8)) & 0xFF;
            colour += ('66' + value.toString(16)).substr(-2);
        }
        return colour;
    }

    onRouteChange(val){          
        this.setState({
            selectedRoutes: Object.assign({}, this.state.selectedRoutes, { [val[0].label]: !this.state.selectedRoutes[val[0].label]}),
        });
    }

    render(){
        return(
            <div className='route-list'>
                <h1>Transit Routes</h1>
                <div>                    
                    <Select
                        name="search-field"
                        multi = {true}
                        searchable = {false}
                        options = {options}
                        placeholder = "Select route(s)"
                        onChange = {this.onRouteChange}
                    />
                    <div ref='selected_routes' className='selected_routes'>
                        <h3>All routes selected</h3>
                    </div>
                </div>
            </div>
        );
    }
}

RouteList.onChange = PropTypes.func;

export default RouteList;