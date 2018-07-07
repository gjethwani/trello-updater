'use babel';

import TrelloUpdaterView from './trello-updater-view';
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
      default: "",
    }
  },


  trelloUpdaterView: null,
  modalPanel: null,
  subscriptions: null,
  api: null,

  exportToTrello() {
    const selectedText = atom.workspace.getSelectedText();

  },

  activate(state) {
    this.trelloUpdaterView = new TrelloUpdaterView(state.trelloUpdaterViewState);
    // this.modalPanel = atom.workspace.addModalPanel({
    //   item: this.trelloUpdaterView.getElement(),
    //   visible: false
    // });

    const button = document.createElement('button');
    button.innerHTML = 'Send to Trello';

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.settingsInit();
    atom.config.observe('trello-updater.devKey', (value) => {
      console.log('value');
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
  },

  setApi() {
    if (!this.credentialsEntered()) {
      return false;
    }

    let api = new Trello(devKey, token);
    return true;
  },

  settingsInit() {
    console.log('settingsinit')
    atom.config.onDidChange('trello-updater.devKey'), ({newValue, oldValue}) => {
      if (newValue && !atom.config.get('trelloUpdater.token')) {
        console.log('here1');
        Shell.openExternal("https://trello.com/1/connect?key=#{newValue}&name=AtomTrello&response_type=token&scope=read,write&expiration=never")
      }
      else {
        console.log('here2');
        sendWelcome();
      }
    }
    atom.config.onDidChange('trello-updater.token'), ({newValue, oldValue}) => {
      if (newValue) {
        console.log('here3');
        sendWelcome();
      }
    }
  },

  getUser(callback) {
    api.get('/1/members/me'), (err, data) => {
      if (err) {
        atom.notifications.addError('Failed to set Trello API, check your credentials');
        api = null;
        return;
      }
      if (data.username) {
        if (callback) {
          callback(data);
        }
      }
    }
  },


  sendWelcome(callback) {
    if (!this.setApi()) {
      return;
    }
    getUser( function(data) {
      if (data.username) {
        atom.notifications.addSuccess(`Hey ${data.fullName} you're good to go!`);
      }
    });
  },

  deactivate() {
    this.subscriptions.dispose();
    this.trelloUpdaterView.destroy();
  },

  toggle() {
    if (!this.setApi() || !api) {
      atom.notifications.addWarning('Please enter your Trello key and token in the settings');
      return;
    }
    if (!hasLoaded) {
      this.setApi();
      this.bottomButton = atom.workspace.addBottomPanel({ item: button });
      return;
    }
  },

};
