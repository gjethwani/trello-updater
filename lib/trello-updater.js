'use babel';

import { CompositeDisposable } from 'atom';
let Trello = require('node-trello');
let Shell = require('shell');

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
      default: false,
    }
  },

  subscriptions: null,
  api: null,
  boardId: null,
  listId: null,

  exportToTrello() {
    // Sample Comment
    // board:sampleBoard,list:sampleList,
    let text = atom.workspace.getActiveTextEditor().getSelections()[0].getText();
    this.getBoardIdFromName('kjn').then(function(data) {
      console.log(data);
    }, function(err) {
      console.log(err);
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

  getBoardIdFromName(name) {
    return new Promise(function(resolve, reject) {
      api.get('/1/members/me/boards', (err, data) => {
        for (boardIndex in data) {
          let board = data[boardIndex];
          if ((board.name).trim() === name.trim()) {
            resolve(board.id);
          }
        }
        reject('Board not found');
      });
    });
  },

  getListIdFromBoard(name, boardId) {
    api.get(`/1/boards/${boardId}/lists`, (err, data) => {
      for (listIndex in data) {
        let list = data[listIndex];
        if ((list.name).trim() === name.trim()) {
          listId = list.id;
          break;
        }
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
    this.workspace.dispose();
  },

  addEventListener(button, workspace) {
    button.addEventListener('click', function() {
      workspace.exportToTrello();
    });
  },

  toggle() {
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
