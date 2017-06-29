import React, {Component} from 'react';
import * as d3 from "d3";
import axios from 'axios';

import './TransitApp.css';
import RouteList from './RouteList';

import arteriesJSON from './arteries.json';
import freewaysJSON from './freeways.json';
import neighborhoodsJSON from './neighborhoods.json';
import streetsJSON from './streets.json';

let lasttime = 0;
let width = window.innerWidth * 0.8 - 18;
let height = window.innerHeight;
let projection = null;

class TransitApp extends Component {
    constructor(){
        super();
        this.state = {
            muni_vehicles: null,            
            path: {},
            routes: null,
            lastUpdateTime: null            
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
        
        let streets = mapSvg.append('g');
        streets.selectAll('path')
            .data(streetsJSON.features)
            .enter()
            .append('path')
            .attr("class", "streets")
            .attr('d', geoPath);

        let neighborhoods = mapSvg.append('g');
        neighborhoods.selectAll('path')
            .data(neighborhoodsJSON.features)
            .enter()            
            .append('path')
            .attr("class", "neighborhoods")
            .attr('d', geoPath);

        let arteries = mapSvg.append('g');
        arteries.selectAll('path')
            .data(arteriesJSON.features)
            .enter()
            .append('path')
            .attr("class", "arteries")
            .attr('d'.geoPath);

        let freeways = mapSvg.append('g');
        freeways.selectAll('path')
            .data(freewaysJSON.features)
            .enter()
            .append('path')
            .attr('d'.geoPath);
        
        let muni_vehicles = mapSvg.append("g");
        this.setState({
            muni_vehicles: muni_vehicles,
            path: geoPath
        });            
    }

    componentDidUpdate(prevProps, prevState){
        if(prevState.muni_vehicles !== this.state.muni_vehicles || prevState.routes !== this.state.routes){            
            this.getVehicleLocations();
            this.timer = setTimeout(() => this.setState({lastUpdateTime: lasttime}), 5000);
            console.log('Called update vehicle locations');
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
            console.log('Nothing selected');
            lasttime = 0;
        }            
        const restURL = 'http://webservices.nextbus.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni&t=' + lasttime;
        clearTimeout(this.timer);
        axios.get(restURL)
            .then(response => {                
                console.log('displaying locations');
                let vehicleLocations = response.data.vehicle;
                console.log(vehicleLocations);

                if(response.data && response.data.lastTime){
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
                if(isRoutesFiltered && self.state.routes && !isAllUnselected){
                    let tempVehicles = vehicleLocations;
                    let filteredList = [];
                    for(var vehicle in tempVehicles){
                        if(self.state.routes[tempVehicles[vehicle].routeTag] === true){
                            filteredList.push(tempVehicles[vehicle]);
                        }
                        //d3.selectAll('#'+tempVehicles[vehicle].id).remove();
                        d3.selectAll('.sfmunis').remove();
                    }
                    // let oldVehicleLocations = self.state.muni_vehicles;
                    // for(vehicle in oldVehicleLocations){
                    //     if(self.state.routes[oldVehicleLocations[vehicle].routeTag] === true){
                    //         filteredList.push(oldVehicleLocations[vehicle]);
                    //     }
                    // }                                   
                    vehicleLocations = filteredList;
                }
                console.log('Filtered list');
                console.log(vehicleLocations);
                //Display the vehicles on the map.
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
                            colour += ('77' + value.toString(16)).substr(-2);
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
                console.log('Done plotting');
                vehiclesPlot.exit().remove();                
            }
        );        
    };

    onRoutesChanged(routes){
        console.log("In TransitApp");
        console.log(routes);
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