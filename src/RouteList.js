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
            let html = '<h1>Selected Routes:</h1><ul>';
            for(var tags in this.state.selectedRoutes){                
                if(this.state.selectedRoutes[tags] === true){
                    html += '<li>' + tags + '</li>';
                    isAllUnselected = false;
                }
            }
            html += '</ul>';
            this.refs.selected_routes.innerHTML = (!isAllUnselected) ? html : '<h3>All routes selected</h3>';            
            this.props.onChange(this.state.selectedRoutes);
        }
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