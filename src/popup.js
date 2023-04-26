import * as React from 'react';
import ReactDOM from 'react-dom';

let popupCss = {
    "width": "250px",
    // "height": "400px",
    "text-align": "center",
    "color": "white",
    "display": "flex",
    "background-image": "url(assets/icon/bg.png)",
    "align-items": "center",
    "flex-direction": "column",
}

let imgCss = {
    "width": "170px"
}


ReactDOM.render(
    <div style={popupCss}>
        <h3>setaire出品 必属精品</h3>
        <h4>一键三连 好运连连！</h4>
        <img src="assets/icon/love.png" style={imgCss} alt="" />
        <p>QQ: 907391489</p>
    </div>,
    document.getElementById('app')
);