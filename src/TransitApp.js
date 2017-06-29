import React, {Component} from 'react';
import * as d3 from "d3";
import axios from 'axios';

import './TransitApp.css';
import RouteList from './RouteList';

import arteriesJSON from './sfmaps/arteries.json';
import freewaysJSON from './sfmaps/freeways.json';
import neighborhoodsJSON from './sfmaps/neighborhoods.json';
import streetsJSON from './sfmaps/streets.json';

let lasttime = 0;
let width = window.innerWidth * 0.8 - 24;
let height = window.innerHeight - 20;
let projection = null;

class TransitApp extends Component {
    constructor(){
        super();
        this.state = {
            muni_vehicles: null,            
            path: {},
            routes: null,            
        };
        this.onRoutesChanged = this.onRoutesChanged.bind(this);
    }

    componentDidMount(){        
        let mapSvg = d3.select('div.maps-panel')
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        
        projection = d3.geoMercator().scale(1).translate([0, 0]).precision(0);
        projection.fitSize([width, height], neighborhoodsJSON);
		const geoPath = d3.geoPath().projection(projection);        
                
        let streets = this.generateMapItem(mapSvg, streetsJSON, geoPath, 'streets');
        let neighborhoods = this.generateMapItem(mapSvg, neighborhoodsJSON, geoPath, 'neighborhoods');
        let arteries = this.generateMapItem(mapSvg, arteriesJSON, geoPath, 'arteries');
        let freeways = this.generateMapItem(mapSvg, freewaysJSON, geoPath, 'freeways');        
        
        let muni_vehicles = mapSvg.append("g");
        this.setState({
            muni_vehicles: muni_vehicles,
            path: geoPath
        });            
    }

    generateMapItem = (mapSvg, data, geoPath, className) => {
        return mapSvg.append("g")
            .selectAll('path')
            .data(data.features)
            .enter()
            .append('path')
            .attr('class', className)
            .attr('d', geoPath);
    }    

    componentDidUpdate(prevProps, prevState){
        if(prevState.muni_vehicles !== this.state.muni_vehicles || prevState.routes !== this.state.routes){            
            this.getVehicleLocations();
            if(this.timer){
                clearTimeout(this.timer);
            }
            this.timer = setTimeout(() => this.getVehicleLocations(), 5000);
        }                 
    }    

    getVehicleLocations = () => { 
        let self = this;
        let isAllUnselected = true;
        //If all the routes are unselected, then fetch the entire muni locations
        for(var key in this.state.routes){
            if(this.state.routes[key] === true){
                isAllUnselected = false;                
            }                
        }     
        if(isAllUnselected){
            lasttime = 0;
        }

        const restURL = 'http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni&t=0';
        axios.get(restURL)
            .then(response => {                
                let vehicleLocations = response.data.vehicle;
                
                if(response.data && response.data.lastTime){
                    //Store the last queried time for later use
                    lasttime = response.data.lastTime.time;                    
                }

                let tooltipDiv = d3.select("body").append("div")	
                    .attr("class", "tooltip")				
                    .style("opacity", 0);
                
                //Filter based on selected routes
                let isRoutesFiltered = false;
                if(self.state.routes !== null){
                    isRoutesFiltered = true;
                }
                //If none of the route tags are selected, then display all vehicles on all routes
                if(isRoutesFiltered && self.state.routes && !isAllUnselected){
                    let tempVehicles = vehicleLocations;
                    let filteredList = [];
                    for(var vehicle in tempVehicles){
                        //Check if the route tag is selected and filter out only those to display
                        if(self.state.routes[tempVehicles[vehicle].routeTag] === true){
                            filteredList.push(tempVehicles[vehicle]);
                        }                        
                    }                                                     
                    vehicleLocations = filteredList;
                }
                d3.selectAll('.sfmunis').remove();
                
                // Draw vehicles on the svg map
                let vehiclesPlot = this.state.muni_vehicles
                    .selectAll('path')
                    .data(vehicleLocations)
                    .enter()
                    .append('circle')
                    .attr('class', 'sfmunis')
					.attr('r', 3)
                    .attr('id', function(d){ return d.id; })
					.attr('fill', function(d) {
                        //Source - https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
                        var str = d.routeTag;
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
                    })
					.attr('fill-opacity', '0.75')
                    .attr("cx", function (d) { 
						return projection([d.lon,d.lat])[0]; 
					})
					.attr("cy", function (d) { 
						return projection([d.lon,d.lat])[1]; 
					})
                    //Tooltip for display bus information
                    .on("mouseover", function(d) {		
                        tooltipDiv.transition()		
                            .duration(200)		
                            .style("opacity", .9);		
                        tooltipDiv.html('Route - ' + d.routeTag + '<br/> Speed - ' + d.speedKmHr + 'km/hr')
                            .style("left", (d3.event.pageX) + "px")		
                            .style("top", (d3.event.pageY - 28) + "px");	
                        })
                    .on("mouseout", function(d) {		
                        tooltipDiv.transition()		
                            .duration(500)		
                            .style("opacity", 0);	
                    })
                    .attr('d', this.state.geoPath);
                vehiclesPlot.exit().remove();                
            }
        );        
    };

    onRoutesChanged(routes){
        this.setState({
            routes: routes
        });
    }

    render(){
        return (
            <div>
                <div className = 'routes-panel'>
                    <RouteList onChange={this.onRoutesChanged}/>
                </div>            
                <div className = 'maps-panel'>                
                </div>
            </div>
        );
    }
}

export default TransitApp;