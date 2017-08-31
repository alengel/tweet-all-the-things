'use strict';

ready(init);

function init() {
    setupColumns();
    addSettingsIconEventListener();
}

//Set up the 3 columns on render
function setupColumns() {
    var leftCol = getLeftColValue(),
        centerCol = getCenterColValue(),
        rightCol = getRightColValue();

    getData(leftCol, 0);
    getData(centerCol, 1);
    getData(rightCol, 2);
}

// Pass Tweet handles and column position to parseJSON to render them in the correct place
function getData(handle, position) {
    parseJSON(buildURL(handle),
        function success(response) {
            var tweets = response.statuses || response;
            if(!tweets.length) {
                addErrorToBoard('There were no tweets in the requested date range. Please check your settings and try again.', position);
                return;
            }

            addTweetsToBoard(tweets, position);
        },
        function error(response) {
            if(response.status === 404) {
                addErrorToBoard('This Twitter user does not exist. Please check your settings and try again.', position);
            } else {
                addErrorToBoard('Check your Internet connection.', position);
            }
        }
    );
}

// Add errors to passed in column
function addErrorToBoard(text, position) {
    var column = document.getElementsByClassName('columns'),
        div = createTag('div', text, ' error');

    column[position].innerHTML = '';
    column[position].appendChild(div);
}

// Heart of the application - adds cards to columns containing tweet info
function addTweetsToBoard(data, position) {
    var column = document.getElementsByClassName('columns');

    column[position].innerHTML = '';

    data.forEach(function(tweetData) {
        var div = createTag('div', null, ' card');
        buildCard(div, tweetData);
        column[position].appendChild(div);
    });

    updateCSS();
}

// Creates the individual cards adding the tweet info
function buildCard(div, tweetData) {
    var author = tweetData.user.name,
        header = createLink('https://twitter.com/' + author, '@' + author, 'author'),
        timestamp = createTag('span', formatDate(tweetData.created_at), 'time'),
        content = createLink('https://twitter.com/' + author + '/status/' + tweetData.id_str, tweetData.text, 'content');

    div.appendChild(timestamp);
    div.appendChild(header);
    div.appendChild(content);
}

// Updates general CSS values
function updateCSS() {
    var header = document.getElementsByTagName('h1');

    for(var i = 0; i < header.length; i++) {
        header[i].style.color = getTitleColor();
    }

    document.body.style.background = getBgColor();
    document.body.style.color = getFontColor();

    setLinkCSS();
    setButtonCSS();
}

// Updates the tweet cards CSS values
function setLinkCSS() {
    var links = document.getElementsByTagName('a');

    for(var i = 0; i < links.length; i++) {
        if(links[i].className === 'content') {
            links[i].style.color = getFontColor();
        }

        if(links[i].className === 'author') {
            links[i].style.color = getLinkColor();
        }
    }
}

function setButtonCSS() {
    var button = document.getElementById('change-value');
    if(button) {
        button.style.background = getLinkColor();
        button.style.borderColor = getLinkColor();
    }
}

function addSettingsIconEventListener() {
    var icon = document.getElementById('settings-icon');
    icon.addEventListener('click', showSettings);
}

// Decide which URL to use. If user uses count, use user_timeline.json, if user uses time range, use tweets.json
function buildURL(handle) {
    var count = getTweetsVolume(),
        startDate = getStartDate(),
        endDate = getEndDate(),
        base_url = 'http://localhost:7890/1.1/',
        count_url = base_url + 'statuses/user_timeline.json\?count\=' + count + '\&screen_name\=' + handle,
        date_url = base_url + 'search/tweets.json?q='+ handle + '&since=' + startDate + '&until=' + endDate;

    return startDate && endDate ? date_url : count_url;
}

// Make the actual request to load in the JSON file and parse it
function parseJSON(url, success, error) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function()
    {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                if (success) {
                    success(JSON.parse(request.responseText));
                }
            } else if(error) {
                error(request);
            }
        }
    };
    request.open("GET", url, true);
    request.send();
}

// Format date using moment showing relative dates from now
function formatDate(date) {
    return moment(date, 'ddd MMM D HH:mm:ss Z YYYY').fromNow();
}

// Retrieve values from localStore if value is stored, otherwise get default value
function getLeftColValue() {
    return localStorage.length && localStorage.leftCol ? localStorage.leftCol : getDefaultValues().leftCol;
}

function getCenterColValue() {
    return localStorage.length && localStorage.centerCol ? localStorage.centerCol : getDefaultValues().centerCol;
}

function getRightColValue() {
    return localStorage.length && localStorage.rightCol ? localStorage.rightCol : getDefaultValues().rightCol;
}

function getTweetsVolume() {
    return localStorage.length && localStorage.tweetsVolume ? parseInt(localStorage.tweetsVolume) : parseInt(getDefaultValues().tweetsVolume);
}

function getStartDate() {
    return localStorage.length && localStorage.startDate ? localStorage.startDate : getDefaultValues().startDate;
}

function getEndDate() {
    return localStorage.length && localStorage.endDate ? localStorage.endDate : getDefaultValues().endDate;
}

function getBgColor() {
    return localStorage.length && localStorage.bgColor ? localStorage.bgColor : getDefaultValues().bgColor;
}

function getTitleColor() {
    return localStorage.length && localStorage.titleColor ? localStorage.titleColor : getDefaultValues().titleColor;
}

function getFontColor() {
    return localStorage.length && localStorage.fontColor ? localStorage.fontColor : getDefaultValues().fontColor;
}

function getLinkColor() {
    return localStorage.length && localStorage.linkColor ? localStorage.linkColor : getDefaultValues().linkColor;
}


// Functions related to using the settings modal

// Load in the settings template for the first time
function loadSettingsTemplate() {
    var tpl = new LoadTemplate('modal', 'settings');
    tpl.create(function(){
        addSettingsEventListeners();
        loadSettings();
    });
}

// Show the settings template to the user
function showSettings() {
    if(!document.getElementById('modal').innerHTML) {
        loadSettingsTemplate();
    }

    document.getElementById('modal').style.display='inline';
}

// Hide settings template from view when not used
function hideSettings() {
    document.getElementById('modal').style.display='none';
}

// Add all event listeners after the modal template is loaded
function addSettingsEventListeners() {
    addCloseEventListener();
    addSettingsButtonEventListener();
    addResetEventListener();
    addClearDateEventListener();
}

function addCloseEventListener() {
    var closeIcon = document.getElementById('close-icon'),
        closeButton = document.getElementById('close-button');

    closeIcon.addEventListener('click', hideSettings);
    closeButton.addEventListener('click', hideSettings);
}

function addSettingsButtonEventListener() {
    var applyChangeButton = document.getElementById('change-value');
    applyChangeButton.addEventListener('click', applyChanges);
}

function addResetEventListener() {
    var resetButton = document.getElementById('reset-styles');
    resetButton.addEventListener('click', resetStyles);
}

function addClearDateEventListener() {
    var clearButton = document.getElementById('clear-dates');
    clearButton.addEventListener('click', clearDates);
}

// Set the values of the settings inputs
function loadSettings() {
    var settings = getSettingsKeys();

    document.getElementById(settings.LEFT_COL).value = getLeftColValue();
    document.getElementById(settings.CENTER_COL).value = getCenterColValue();
    document.getElementById(settings.RIGHT_COL).value = getRightColValue();

    document.getElementById(settings.VOLUME).value = getTweetsVolume();
    document.getElementById(settings.START_DATE).value = getStartDate();
    document.getElementById(settings.END_DATE).value = getEndDate();

    setColorValues(settings);
}

// Set the color values of the input fields
function setColorValues(settings) {
    document.getElementById(settings.BG_COLOR).value = getBgColor();
    document.getElementById(settings.TITLE_COLOR).value = getTitleColor();
    document.getElementById(settings.FONT_COLOR).value = getFontColor();
    document.getElementById(settings.LINK_COLOR).value = getLinkColor();

    updateCSS();
}

// Called when "Apply Changes" is clicked. Saves all input values to localstorage and reloads Columns.
function applyChanges() {
    var settings = getSettingsKeys();

    saveItem(settings.VOLUME, document.getElementById(settings.VOLUME).value);
    saveItem(settings.START_DATE, document.getElementById(settings.START_DATE).value);
    saveItem(settings.END_DATE, document.getElementById(settings.END_DATE).value);

    saveItem(settings.BG_COLOR, document.getElementById(settings.BG_COLOR).value);
    saveItem(settings.TITLE_COLOR, document.getElementById(settings.TITLE_COLOR).value);
    saveItem(settings.FONT_COLOR, document.getElementById(settings.FONT_COLOR).value);
    saveItem(settings.LINK_COLOR, document.getElementById(settings.LINK_COLOR).value);

    reloadColumns();
    updateCSS();
    hideSettings();
}

function reloadColumns() {
    var settings = getSettingsKeys();

    reloadLeftColumn(settings);
    reloadCenterColumn(settings);
    reloadRightColumn(settings);
}

function reloadLeftColumn(settings) {
    var leftColValue = document.getElementById(settings.LEFT_COL).value;

    if(leftColValue !== localStorage.getItem(settings.LEFT_COL)) {
        saveItem(settings.LEFT_COL, leftColValue);
    }
    getData(leftColValue, 0);
}

function reloadCenterColumn(settings) {
    var centerColValue = document.getElementById(settings.CENTER_COL).value;

    if(centerColValue !== localStorage.getItem(settings.CENTER_COL)) {
        saveItem(settings.CENTER_COL, centerColValue);
    }
    getData(centerColValue, 1);
}

function reloadRightColumn(settings) {
    var rightColValue = document.getElementById(settings.RIGHT_COL).value;

    if(rightColValue !== localStorage.getItem(settings.RIGHT_COL)) {
        saveItem(settings.RIGHT_COL, rightColValue);
    }
    getData(rightColValue, 2);
}

// Called when "Reset All Default Settings" is clicked. Clears localstorage and applies default values again.
function resetStyles() {
    localStorage.clear();
    loadSettings();
    applyChanges();
}

// Clears date input fields
function clearDates() {
    var settings = getSettingsKeys();

    document.getElementById(settings.START_DATE).value = '';
    document.getElementById(settings.END_DATE).value = '';
}

// Default values - to avoid magic strings
function getDefaultValues() {
    return {
        leftCol: 'makeschool',
        centerCol: 'laughingsquid',
        rightCol: 'techcrunch',
        tweetsVolume: 30,
        startDate: '',
        endDate: '',
        bgColor: '#FFFFFF',
        titleColor: '#222222',
        fontColor: '#222222',
        linkColor: '#1EAEDB'
    };
}

function getSettingsKeys() {
    return {
        LEFT_COL: 'leftCol',
        CENTER_COL: 'centerCol',
        RIGHT_COL: 'rightCol',
        VOLUME: 'tweetsVolume',
        START_DATE: 'startDate',
        END_DATE: 'endDate',
        BG_COLOR: 'bgColor',
        TITLE_COLOR: 'titleColor',
        FONT_COLOR: 'fontColor',
        LINK_COLOR: 'linkColor'
    }
}


// Utility functions

// Create any HTML tag with a CSS class
function createTag(type, text, cssClass) {
    var tag = document.createElement(type);
    tag.className += cssClass;
    tag.innerHTML = text;

    return tag;
}

// Create HTML link
function createLink(linkText, text, cssClass) {
    var link = createTag('a', text, cssClass);
    link.setAttribute('href', linkText);
    link.setAttribute('target', '_blank');

    return link;
}

// Save item to localstorage
function saveItem(key, value) {
    localStorage.setItem(key, value);
}

// Ready function for new browsers
function ready(fn) {
    if (document.readyState !== 'loading'){
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}
