# trello-updater

Welcome to trello-updater! This is a tool that lets you create Trello cards from code comments at the click of a button straight from Atom, removing the need to actually visit the Trello website. All you need to do is highlight the comment and click the "Send to Trello" button and you're good to go!

## Installation
###### Command line:
```apm install trello-updater```
###### From Atom:
Go to `Preferences -> Install` then search for `trello-updater`, then click install.

## Initial Setup
1. Go to the settings for trello-updater
2. Click the link shown in settings to generate your Trello Developer key, or visit this link: https://trello.com/1/appKey/generate (you may need to login to Trello if not already logged in)
3. Copy your key and paste your developer key in the corresponding input.
4. You will be redirected to a browser page containing your Trello token. Copy and paste this into the Token input.
5. You should receive a message if the package successfully connected to Trello.

## Activate the package
- `Packages -> trello-updater -> toggle`
- right-click and select `Toggle trello-updater`.

## Sending a comment to Trello
Your comment needs to be in a certain format. Each parameter needs to be in the form `parameter:value` and all parameters need to be separated by semi-colons. The order and spacing does not matter. Here is an example:

```// board:sample-board;list:sample-list;name:sample-name;desc:this is a description```

The above will create a card in a list called 'sample-list' in a board called 'sample-board' and the name of the card will be 'sample-name' and it will have description 'this is a description'. Here is a list of parameters you can include in your comment. The names of the parameters in your comment must match the names in the table below exactly.

| Parameter Name | Description                                                        | Required |
|----------------|--------------------------------------------------------------------|----------|
| board          | The name of the board you would like to add to                     | Yes      |
| list           | The name of the list on the board above                            | Yes      |
| name           | The name of the card you would like to create                      | Yes      |
| desc           | The description of the card                                        | No       |
| pos            | The position of the new card: 'top', 'bottom', or a positive float | No       |
| due            | A due date for the card in the format YYYY-MM-DD                   | No       |
| dueComplete    | A boolean value whether the card is complete or not                | No       |
| idMembers      | Comma-separated list of member IDs to add to the card              | No       |
| idLabels       | Comma-separated list of label IDs to add to the card               | No       |
| urlSource      | A URL starting with http:// or https://                            | No       |
| idCardSource   | The ID of a card to copy into the new card                         | No       |

Refer to https://developers.trello.com/reference/#cards-2 for more information.

Once you have your comment, simple highlight the comment then click the "Send to Trello" button that is at the bottom of your Atom workspace and you will receive a notification that says your card was either added successfully or unsuccessfully

Special thanks to [sgengler](https://github.com/sgengler)
