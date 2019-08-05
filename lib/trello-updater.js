'use babel';

import { CompositeDisposable } from 'atom';
let Trello = require('node-trello');
let Shell = require('shell');

function getBoardIdFromName(name) {
  return new Promise(function(resolve, reject) {
    api.get('/1/members/me/boards', (err, data) => {
      if (err) {
        reject(err);
      }
      for (boardIndex in data) {
        let board = data[boardIndex];
        if ((board.name).trim() === name.trim()) {
          resolve(board.id);
        }
      }
      reject(`Board '${name}' not found`);
    });
  });
}

function getListIdFromBoard(name, boardId) {
  return new Promise(function(resolve, reject) {
    api.get(`/1/boards/${boardId}/lists`, (err, data) => {
      if (err) {
        reject(err);
      }
      for (listIndex in data) {
        let list = data[listIndex];
        if ((list.name).trim() === name.trim()) {
          resolve(list.id);
        }
      }
      reject(`List '${name}' not found`);
    });
  })
}

function createCard(card) {
  return new Promise(function(resolve, reject) {
    api.post('/1/cards', card, (err, attachments) => {
      if (err) {
        reject(err);
      } else {
        resolve(attachments);
      }
    });
  });
}

function constructJSON(lineNo, textArray) {
  var obj = {}
  for (var i = 0; i < textArray.length; i++) {
    var rawElem = textArray[i];
    rawElem = rawElem.trim();
    var elemArray = rawElem.split(':');
    if (elemArray.length != 2) {
      obj['err'] = 'Invalid comment formatting';
      return obj;
    }
    obj[elemArray[0]] = elemArray[1];
  }
  if (!obj.hasOwnProperty('board')) {
    obj['err'] = 'Missing board property';
    return obj;
  }
  if (!obj.hasOwnProperty('list')) {
    obj['err'] = 'Missing list property';
    return obj;
  }
  if (!obj.hasOwnProperty('name')) {
    obj['err'] = 'Missing name property';
    return obj;
  }
  var name = obj.name;
  name = '[Line ' + (lineNo + 1) + '] ' + name;
  obj.name = name;
  return obj;
}

export default {

  config: {
    devKey: {
      title: "Trello Developer Key",
      description: "Get your key at https://trello.com/1/appKey/generate",
      type: "string",
      default: "",
    },
    token: {
      title: "Token",
      description: "Add developer key and you will be redirected to get your token. Paste below.",
      type: "string",
      default: "",
    }
  },

  subscriptions: null,
  api: null,

  exportToTrello() {
    var lineNo = atom.workspace.getActiveTextEditor().getCursorBufferPosition().row;
    var text = atom.workspace.getActiveTextEditor().getSelections()[0].getText();
    text = text.replace('//','');
    text = text.replace('/*','');
    text = text.replace('*/','');
    var textArray = text.split(';');
    var textObject = constructJSON(lineNo, textArray);
    if (textObject.hasOwnProperty('err')) {
      atom.notifications.addError(textObject.err);
      return;
    }
    getBoardIdFromName(textObject.board).then(function(boardId) {
      getListIdFromBoard(textObject.list, boardId).then(function(listId) {
        textObject.idList = listId;
        createCard(textObject).then(function(attachments) {
          atom.notifications.addSuccess(`Card '${textObject.name}' added to list '${textObject.list}' on board '${textObject.board}'`);
        }, function(err) {
          console.log(err);
          atom.notifications.addError(`Unexpected error with card '${textObject.name}', please try again later`);
        });
      }, function(err) {
        atom.notifications.addError(err);
      });
    }, function(err) {
      atom.notifications.addError(err);
    });
  },

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    atom.config.observe('trello-updater.devKey', (value) => {
      if (value && !atom.config.get('trello-updater.token')) {
        Shell.openExternal(`https://trello.com/1/connect?key=${value}&name=TrelloUpdater&response_type=token&scope=read,write&expiration=never`)
      }
    });
    atom.config.observe('trello-updater.token', (value) => {
      if (value) {
        this.setApi();
        this.sendWelcome();
      }
    });
    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'trello-updater:toggle': () => this.toggle()
    }));
  },

  credentialsEntered() {
    let devKey = atom.config.get('trello-updater.devKey');
    let token = atom.config.get('trello-updater.token');

    if (!devKey || !token) {
      return false;
    }
    return true;
  },

  setApi() {
    let devKey = atom.config.get('trello-updater.devKey');
    let token = atom.config.get('trello-updater.token');

    if (!this.credentialsEntered()) {
      return false;
    }

    api = new Trello(devKey, token);
    return true;
  },

  getUser() {
    api.get('/1/members/me', (err, data) => {
      if (err) {
        atom.notifications.addError('Failed to set Trello API, check your credentials');
        api = null;
        return;
      }
      if (data.username) {
        atom.notifications.addSuccess(`Hey ${data.fullName} you're good to go!`);
      }
    });
  },

  sendWelcome() {
    if (!this.setApi()) {
      return;
    }
    this.getUser();
  },

  deactivate() {
    this.subscriptions.dispose();
    var panels = atom.workspace.getBottomPanels();
    for (var i = 0; i < panels.length; i++) {
      panels[i].destroy();
    }
  },

  addEventListener(button, workspace) {
    button.addEventListener('click', function() {
      workspace.exportToTrello();
    });
  },

  toggle() {
    this.deactivate();
    if (!this.setApi() || !api) {
      atom.notifications.addWarning('Please enter your Trello key and token in the settings');
      return;
    } else {
      const button = document.createElement('button');
      button.innerHTML = 'Send to Trello';
      button.id = 'exportButton';
      this.addEventListener(button, this);
      this.bottomButton = atom.workspace.addBottomPanel({ item: button });
    }
  },

};
