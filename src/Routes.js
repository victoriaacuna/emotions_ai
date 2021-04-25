import React, { useState } from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import App from './App';
import Blazeface from './components/blazeface';
import ManuelModel from './components/ManuelModel';
// import ProtectedRoute from './ProtectedRoute'

function Routes() {

  return (
    <div className="Routes">
      <BrowserRouter>
        <Switch>
          {/* Users */}
          <Route exact path="/" component={App}/>,
          <Route exact path="/blazeface" component={Blazeface}/>,
          <Route exact path="/manuel" component={ManuelModel}/>,
          {/* <ProtectedRoute exact path="/:landing/main" role={isUser} component={UserMain}/>, */}
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default Routes;