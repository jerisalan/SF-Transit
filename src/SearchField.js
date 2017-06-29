import React, {Component} from 'react';
import './SearchField.css';
import PropTypes from 'prop-types';

let options = [];

class SearchField extends Component{
    constructor(){
        super();
        this.state = {
            typedContent: ""
        }
    }
    
    componentDidUpdate(prevProps, prevState){
        if(prevState.typedContent !== this.state.typedContent){
            this.props.onChange(this.state.typedContent);
        }
    }

    performSearch(event){
        console.log('Searching.....' + event.target.value);
        this.setState({typedContent: event.target.value});
    }

    render(){
        return (
            <div>
                
                <input id='search' name='search' placeholder='Search Bus' onChange={this.performSearch.bind(this)}/>
            </div>
        );
    }    
};

SearchField.PropTypes = {
    onChange: PropTypes.func
};

export default SearchField;