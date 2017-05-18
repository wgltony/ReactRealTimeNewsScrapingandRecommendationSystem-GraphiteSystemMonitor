import './NewsPanel.css';

import _ from 'lodash';

import React from 'react';
import Auth from '../Auth/Auth';
import NewsCard from '../NewsCard/NewsCard'
import SearchModal from './SearchModal'
import { Button, Col, Preloader, Row, Chip, Icon } from 'react-materialize';
import Notifications, {notify} from 'react-notify-toast';

class NewsPanel extends React.Component{
  constructor() {
    super();
    //this.show = notify.createShowQueue();
    this.state = {news:null, pageNum:1, totalPages:1,loading:false,loadedAll:false,showModal: false,searchPageNum:1,searchText:null, searchNews: null};   // read state
    this.handleScroll = this.handleScroll.bind(this);  // bind call back function
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.inputHandler = this.inputHandler.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    //this.toTop = this.toTop.bind(this);
  }

  // execute didMount function after constructe finished, react method
  componentDidMount() {
    this.loadMoreNews();
    this.handleSearch = _.debounce(this.handleSearch, 1000); // execute function once per 3000ms
    this.loadMoreNews = _.debounce(this.loadMoreNews, 1000); // execute function once per 1000ms
    window.addEventListener('scroll', this.handleScroll);  //call back function need to bind
  }

  componentWillUnmount() {
   window.removeEventListener('scroll', this.handleScroll);  //call back function need to bind
}

  handleScroll() {
    let scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    if ((window.innerHeight + scrollY) >= (document.body.offsetHeight - 500)) {
       this.setState({
         loading:true
       })
      //this.forceUpdate();
      this.state.searchNews?this.handleSearch():this.loadMoreNews();
    }
  }

  sendLoadNewsEvent() {
    //console.log('send monitor data...');
    let Config = require('Config')
    let url = Config.production_server+'/monitor/process/'+Config.loadNewsMetric;

    let request = new Request(encodeURI(url), {
      method: 'POST',
      headers: {
        'Authorization': 'bearer ' + Auth.getToken(),
      },
      cache: false});

    fetch(request);
  }


  loadMoreNews() {
    this.sendLoadNewsEvent()
    //console.log('Loading news...');
    let Config = require('Config');

    if(this.state.loadedAll === true){
      return;
    }
    let url = Config.production_server+'/news/userId/' + Auth.getEmail()
              + '/pageNum/' + this.state.pageNum;
    let request = new Request(encodeURI(url), {
      method: 'GET',
      headers: {
        'Authorization': 'bearer ' + Auth.getToken(),
      },
      cache: false});

    fetch(request)
      .then((res) => res.json())
      .then((news) => {
        //console.log(news);
        if(!news || news.length ===0){
          this.renderNoResult();
          this.setState({loadedAll:true});
        }

        this.setState({ // set state use setState, react will update UI
          news: this.state.news? this.state.news.concat(news) : news,
          pageNum: this.state.pageNum + 1,
          loading:false
        });
      });
  }

  toTop(){
    window.scrollTo(0,0);
  }

  handleOpenModal () {
    this.setState({ showModal: true });
  }

  handleCloseModal () {
    this.setState({ showModal: false });
  }

  inputHandler(e){
    if(typeof(e)!='undefined')
      if(e.target!=null){   //reset search status
        this.state.loadedAll=false
        this.state.searchPageNum = 1;
        this.state.searchText = e.target.value;
        this.state.searchNews = null;
        if (e.key === 'Enter') {
            this.toTop();
            this.handleSearch();
            //console.log('Enter key pressed');
          }
      }
    //console.log('input handler this.state.searchText: ' + this.state.searchText);
    //console.log('length of text ' +  this.state.searchText.length);
  }

  sendSearchNewsEvent() {
    //console.log('send monitor data...');
    let Config = require('Config')
    let url = Config.production_server+'/monitor/process/'+Config.searchNewsMetric;

    let request = new Request(encodeURI(url), {
      method: 'POST',
      headers: {
        'Authorization': 'bearer ' + Auth.getToken(),
      },
      cache: false});

    fetch(request);
  }

  handleSearch(){
    this.state.news=null; //zero search result
    if(this.state.searchText.length===0 || this.state.loadedAll){  //avoid empty string value search
      this.state.loading=false;
      return;
    }

    this.sendSearchNewsEvent();
    // this.state.searchPageNum = 1
    //console.log('searth with text -> this.state.searchText: ' + this.state.searchText);
    //console.log('e.target.value: ' + e.target.value);

    let Config = require('Config')

    let url = Config.production_server+'/search/userId/' + Auth.getEmail()
              + '/pageNum/' + this.state.searchPageNum+'/key/'+this.state.searchText;
    let request = new Request(encodeURI(url), {
      method: 'GET',
      headers: {
        'Authorization': 'bearer ' + Auth.getToken(),
      },
      cache: false});

    fetch(request)
      .then((res) => res.json())
      .then((news) => {
        console.log(news+" length: "+news.length);
        if(!news || news.length ===0){
          this.renderNoResult();
          this.setState({
            loading:false,
            loadedAll:true
          })
          return;
        }

        this.setState({ // set state use setState, react will update UI
          searchNews: this.state.searchNews? this.state.searchNews.concat(news) : news,
          searchPageNum: this.state.searchPageNum + 1,
          loading:false
        });
      });

      this.handleCloseModal();
  }

  reloadPage(){
    window.location.reload();
  }


  controlButtonGroup(){
    return(
      <div>
      <Button floating waves='light' fab='vertical' faicon='fa fa-plus' className='red' large style={{bottom: '45px', right: '24px'}}>
      <Button floating waves='light' icon='navigation' className='green' onClick={this.toTop}/>
      <SearchModal showModal={this.state.showModal}
                   handleOpenModal={this.handleOpenModal}
                   handleCloseModal={this.handleCloseModal}
                   inputHandler={this.inputHandler}
                   />
      <Button floating waves='light' icon='loop' className='yellow' onClick={this.reloadPage}/>
      </Button>
      <Button floating pulse waves='light' fab='horizontal' icon='view_list' className='red' large style={{bottom: '45px', right: '24px'}}>
      <Button floating waves='light' icon='navigation' className='green' onClick={this.toTop}/>
      <SearchModal showModal={this.state.showModal}
                   handleOpenModal={this.handleOpenModal}
                   handleCloseModal={this.handleCloseModal}
                   inputHandler={this.inputHandler}
                   />
      </Button>
      </div>
    );
  }

  renderNoResult(){
    notify.show('No More Result!', 'error', 5000);
    //this.state.loadedAll=false;
  }

  renderNews() {
    //map function iterate all news as list, and loop display
    let news_list = this.state.news.map(news => {
      //give NewsCard news as a varible
      //Need to make sure each list has a unique key for react to indetify which part need to refresh
      return(
        <a className='list-group-item' href="#">
          <NewsCard news={news} />
        </a>
      );
    });

  if(this.state.loading && !this.state.loadedAll) {
    return(
      <div className="container-fluid">
        <div className='list-group'>
          {news_list}
          <Row>
          <Col s={5}></Col>
          <Col s={2}>
          <Preloader flashing size='big'/>
          </Col>
          <Col s={5}></Col>
          </Row>
        </div>
      </div>
    );
  }else{
    return(
      <div className="container-fluid">
        <div className='list-group'>
          {news_list}
        </div>
      </div>
    );
  }
  }

  renderSearchNews() {
    //map function iterate all news as list, and loop display
    let news_list = this.state.searchNews.map(news => {
      //give NewsCard news as a varible
      //Need to make sure each list has a unique key for react to indetify which part need to refresh
      return(
        <a className='list-group-item' href="#">
          <NewsCard news={news} />
        </a>
      );
    });


    if(this.state.loading && !this.state.loadedAll) {
      return(
        <div className="container-fluid">
          <div className='list-group'>
            {news_list}
            <Row>
            <Col s={5}></Col>
            <Col s={2}>
            <Preloader flashing size='big'/>
            </Col>
            <Col s={5}></Col>
            </Row>
          </div>
        </div>
      );
    }else{
      return(
        <div className="container-fluid">
          <div className='list-group'>
            {news_list}
          </div>
        </div>
      );
    }
  }

  render() {
    //console.log('this.state.loadedAll' + this.state.loadedAll);
    //console.log('this.state.loading' + this.state.loading);
    // if(this.state.loadedAll && this.state.loading){
    //   this.renderNoResult();
    // }
    if (this.state.searchNews) {  // if searchNews exist
        return(
          <div>
            <Notifications />
            {this.controlButtonGroup()}
            {this.renderSearchNews()}
          </div>
        );
    }
    else if (this.state.news) {  // if news exist
        return(
          <div>
            <Notifications />
            {this.controlButtonGroup()}
            {this.renderNews()}
          </div>
        );
    } else if(this.state.loadedAll){
      return(
        <div>
          <div id='msg-app-loading'>
          <Notifications />
          {this.controlButtonGroup()}
        </div>
        </div>
      );
    }else{
      return(
        <div>
          <div id='msg-app-loading'>
          <Notifications />
          {this.controlButtonGroup()}
          <Row>
          <Col s={5}></Col>
          <Col s={2}>
          <Preloader flashing size='big'/>
          </Col>
          <Col s={5}></Col>
          </Row>
        </div>
        </div>
      );
    }
  }
}

export default NewsPanel;
