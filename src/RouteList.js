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
                //console.log(response.data.route);
                response.data.route.map(route =>
                    options.push({
                        label: route.tag,
                        value: route.title
                    })
                )
                //console.log(options);
                this.setState({ allRoutes: response.data.route });
            })
            .catch((error) => {
                console.log(error);
            });            
    }

    componentDidUpdate(prevProps, prevState){
        console.log('Previous state');
        console.log(prevState.selectedRoutes);
        if(prevState.selectedRoutes !== this.state.selectedRoutes){
            this.props.onChange(this.state.selectedRoutes);
        }
    }

    onRouteChange(val){                
        this.setState({
            selectedRoutes: Object.assign({}, this.state.selectedRoutes, { [val[0].label]: !this.state.selectedRoutes[val[0].label]})
        });
    }

    render(){
        return(
            <div className='route-list'>
                <h1>Transit Routes</h1>
                <div>
                    {/*{this.state.allRoutes.map(route =>                        
                        <div>
                        <input id={route.tag} type='checkbox' checked={this.state.selectedRoutes[route.tag] || false} name={route.tag} onChange={this.handleInputChange(route)}/>{route.title}                        
                        </div>
                    )}*/}
                    <Select
                        name="search-field"
                        multi = {true}
                        searchable = {false}
                        options = {options}
                        placeholder = "Select route(s)"
                        onChange = {this.onRouteChange}
                    />
                </div>
            </div>
        );
    }
}

RouteList.onChange = PropTypes.func;

export default RouteList;