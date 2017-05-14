import './NewsCard.css';
import Auth from '../Auth/Auth';

import React from 'react';

class NewsCard extends React.Component{
  //define redirectToUrl function
  redirectToUrl(e,url) {
    e.preventDefault();
    this.sendClickLog();
    this.sendClickMonitor();
    window.open(url, '_blank');
  }

  sendClickLog() {
    let Config = require('Config')
    let url = 'http://98.224.216.111:3000/news/userId/' + Auth.getEmail()
              + '/newsId/' + this.props.news.digest;

    let request = new Request(encodeURI(url), {
      method: 'POST',
      headers: {
        'Authorization': 'bearer ' + Auth.getToken(),
      },
      cache: false});

    fetch(request);
  }

  sendClickMonitor() {
    console.log('send monitor data...');
    let Config = require('Config')
    let url = 'http://98.224.216.111:3000/monitor/process/'+Config.userClickMetric;

    let request = new Request(encodeURI(url), {
      method: 'POST',
      headers: {
        'Authorization': 'bearer ' + Auth.getToken(),
      },
      cache: false});

    fetch(request);
  }

  //if != null do something
  //this.props means parents' varible.
  render() {
    return(
      <div>
      <div className="card horizontal hoverable small row hide-on-small-only" onClick={() => this.redirectToUrl(event,this.props.news.url)}>
      <div className="fill col l4 m4">
        <img src={this.props.news.urlToImage}/>
      </div>
      <div className="card-stacked col l8 m8">
        <div className="card-content textfill col l12 m12">
          <h4 className="black-text block-with-text">{this.props.news.title}</h4>
          <p className="grey-text text-darken-3 block-with-text">{this.props.news.description}</p>
        </div>
        <div className="card-action col l12 m12 cards">
          {this.props.news.reason != null && <div className='chip light-green news-chip'>{this.props.news.reason}</div>}
          {this.props.news.source != null && <div className='chip light-blue news-chip'>{this.props.news.source}</div>}
          {this.props.news.class != null && <div className='chip news-chip'>{this.props.news.class}</div>}
          {this.props.news.time != null && <div className='chip amber news-chip'>{this.props.news.time}</div>}
        </div>
      </div>
    </div>

    <div className="row hide-on-med-and-up hoverable small" onClick={() => this.redirectToUrl(event,this.props.news.url)}>
        <div className="col s12">
          <div className="card">
            <div className="card-image">
              <img src={this.props.news.urlToImage}/>
            </div>
            <div className="card-content">
            <span className="card-title black-text">{this.props.news.title}</span>
              <p className="grey-text text-darken-3">{this.props.news.description}</p>
            </div>
            <div className="card-action">
            {this.props.news.reason != null && <div className='chip light-green news-chip'>{this.props.news.reason}</div>}
            {this.props.news.source != null && <div className='chip light-blue news-chip'>{this.props.news.source}</div>}
            {this.props.news.class != null && <div className='chip news-chip'>{this.props.news.class}</div>}
            {this.props.news.time != null && <div className='chip amber news-chip'>{this.props.news.time}</div>}
            </div>
          </div>
        </div>
      </div>
      </div>
);
  }
}

export default NewsCard;


// return(
//   <div className="news-container hoverable" onClick={() => this.redirectToUrl(event,this.props.news.url)}>
//     <div className='row'>
//       <div className='col s4 fill'>
//         <img src={this.props.news.urlToImage} alt='news'/>
//       </div>
//       <div className="col s8">
//         <div className="news-intro-col">
//           <div className="news-intro-panel">
//             <h4>{this.props.news.title}</h4>
//             <div className="news-description">
//               <p>{this.props.news.description}</p>
//               <div>
//                 {this.props.news.reason != null && <div className='chip light-green news-chip'>{this.props.news.reason}</div>}
//                 {this.props.news.source != null && <div className='chip light-blue news-chip'>{this.props.news.source}</div>}
//                 {this.props.news.class != null && <div className='chip news-chip'>{this.props.news.class}</div>}
//                 {this.props.news.time != null && <div className='chip amber news-chip'>{this.props.news.time}</div>}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// );
