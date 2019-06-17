/**
 * Created by choda on 7/11/2018.
 */
const Alexa = require('alexa-sdk');
const config = require('./config');
const _ = require('lodash');
const Promise = require('bluebird');

function WriteANote() {
    var self = this;
    const intentObj = this.event.request.intent;
    const userId = this.event.context.System.user.userId;
    if (intentObj.slots['note'] && intentObj.slots['note'].value) {
        var dateObj = new Date();
        var date = dateObj.getFullYear() + "-" +
            ((dateObj.getMonth() + 1) > 10? (dateObj.getMonth() + 1): ("0" + (dateObj.getMonth() + 1))) + "-" +
            (dateObj.getDate()> 10? dateObj.getDate(): ("0" + dateObj.getDate()));

        if(intentObj.slots['date'] && intentObj.slots['date'].value) {
            date = intentObj.slots['date'].value;
        }

        createOrUpdateItem(config.TABLENAME, {
            userId: userId,
            date: date
        }, {note: intentObj.slots['note'].value}).then(function (value) {
            if(value) {
                self.response.speak("Ok. Successfully saved your memoir.");
                self.emit(':responseReady');
            } else {
                self.response.speak("Something went wrong. Try Later.");
                self.emit(':responseReady');
            }
        })
    } else {
        this.emit(':delegate');
    }
}

function GetMyNote() {
    var self = this;
    const intentObj = this.event.request.intent;
    const userId = this.event.context.System.user.userId;
    if (intentObj.slots['date'] && intentObj.slots['date'].value) {
        getItem(config.TABLENAME, {userId: userId, date: intentObj.slots['date'].value}).then(function (item) {
            if(!item) {
                self.response.speak("No journal noted on " + intentObj.slots['date'].value);
                self.emit(':responseReady');
                return;
            }
            var message = 'Here is your memoir on ' + intentObj.slots['date'].value + ". ";
            _.map(item.data, function (msgObj) {
                message += msgObj.note + ". ";
            });
            self.response.speak(message);
            self.emit(':responseReady');
        }).catch(function (reason) {
            console.log("Error in GetMeData ",reason.stack);
            self.response.speak("Something went wrong. Try Later.");
            self.emit(':responseReady');
        });
    } else {
        this.emit(':delegate');
    }
}

function launchRequest() {
    this.response.speak('Hello, Welcome to the Memoir. You can save your daily memories by saying \"write a note\"' +
        ' and listen to your memories by asking \"get my yesterdays note\"')
        .listen('Sorry! I din\'t get that, Can you say it again?');
    this.emit(':responseReady');
}

function helpHandler() {
    this.response.speak('You can start listening to chapters by saying play one, two or three. and start asking questions if any. ')
        .listen('Sorry! I din\'t get that, Can you choose again?')
    this.emit(':responseReady');
}

function fallbackHandler() {
    this.response.speak('Sorry! I can\'t do that. I can save your memories and read it back when you wanted to. You can save your memories by saying \"write a note\"' +
        ' and listen to your memories by asking \"get my yesterdays note\"')
        .listen('Sorry! I din\'t get that, Can you say it again?');
    this.emit(':responseReady');
}

function exitHandler() {
    this.response.speak("Ok. Good bye. Comeback soon!");
    this.emit(':responseReady');
}

function unhandled() {
    this.response.speak('Sorry! I can\'t do that. I can save your memories and read it back when you wanted to. You can save your memories by saying \"write a note\"' +
        ' and listen to your memories by asking \"get my yesterdays note\"')
        .listen('Sorry! I din\'t get that, Can you say it again?');
    this.emit(':responseReady');
}

function sessionEndedRequest() {
    this.response.speak("Ok. Good bye. Comeback soon!");
    this.emit(':responseReady');
}

const handlers = {
    'LaunchRequest': launchRequest,
    'AMAZON.HelpIntent': helpHandler,
    'AMAZON.FallbackIntent': fallbackHandler,
    'WriteANote': WriteANote,
    'GetMyNote': GetMyNote,
    'SessionEndedRequest': sessionEndedRequest,
    'AMAZON.CancelIntent': exitHandler,
    'AMAZON.StopIntent': exitHandler,
    'AMAZON.PauseIntent': exitHandler,
    'AMAZON.StartOverIntent': exitHandler,
    'AMAZON.ResumeIntent': exitHandler,
    'AMAZON.RepeatIntent': exitHandler,
    'Unhandled': unhandled
};

exports.handler = function (event, context, callback) {
    console.log("***********EVENT***********", JSON.stringify(event));
    const alexa = Alexa.handler(event, context);
    alexa.appId = config.APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
