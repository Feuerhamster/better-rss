class BetterRSS{

	constructor(options) {

		const events = require("events");
		this._url = require("url");
		this._axios = require("axios");
		this._xml = require("xml-js");

		this._events = new events.EventEmitter();

		this.updateInterval = options.updateInterval ? options.updateInterval : 120000;
		this.itemLimit = options.itemLimit ? options.itemLimit : null;
		this.fetchExtraImages = !!options.extraImages;
		this._currentFeeds = {};
		this.cacheImages = options.cacheImages !== false;
		this._imageCache = {};
		this._filterFunction = null;

		if(options.feeds && Array.isArray(options.feeds)){

			options.feeds.forEach((feed) => {
				this._currentFeeds[feed] = null;
			});

		}

		this._updater = null;

		//initial to fetch all feeds on start
		this.updateFeeds();

		// start auto update
		if(options.autoUpdate !== false){
			this.updater().start();
		}

	}

	updateFeeds(){

		// loop over all feed urls
		for(let url in this._currentFeeds){

			// get _rss feed
			this.getRSS(url)
				.then((feed) => {

					/*
					* Check if the feed must be initialized.
					* A feed is not initialized, if in this._currentFeeds[feed] is an empty object.
					* If a feed is not initialized, the loop over items and event emitter will be ignored.
					* */
					if(this._currentFeeds[url] !== null){

						//create check-array
						let checkArray = Array.from(this._currentFeeds[url].items, el => el.link);

						// loop over all items in feed
						for(let item of feed.items){
							// check if there is a new item
							if(!checkArray.includes(item.link)){

								// Apply filter
								if(!this._filterFunction || (this._filterFunction && this._filterFunction(item, feed))){
									this._events.emit("newItem", item, feed);
								}

							}

						}

					}

					/*
					* Set _currentFeeds for this feed to array with links of all items
					* This will be done every time to be up-to-date with all items
					* */
					this._currentFeeds[url] = feed;

				})
				.catch((err) => {
					this._events.emit("error", err);
				});

		}

	}

	updater(){

		return {
			start: () => {

				// check if updater is null. If not, clear it
				if(this._updater !== null){
					clearInterval(this._updater);
				}

				this._updater = setInterval(() => {

					this._events.emit("updating");

					this.updateFeeds();

				}, this.updateInterval);

			},
			stop: () => {

				if(this._updater !== null){

					clearInterval(this._updater);
					this._updater = null;

					return true;

				}else{
					return false;
				}

			},
			update: () => this.updateFeeds()
		}

	}

	on(event, callback){

		this._events.on(event, callback);

	}

	feeds(){
		return {
			add: (url) => {

				if(!this._currentFeeds[url]){

					this._currentFeeds[url] = null;
					return true;

				}else{
					return false;
				}

			},
			get: (feed) => {

				if(typeof feed === "number"){

					let feeds = Object.keys(this._currentFeeds);

					if(feeds[feed]){
						return this._currentFeeds[feeds[feed]];
					}else{
						return false;
					}

				}else{
					if(this._currentFeeds[feed]){
						return this._currentFeeds[feed];
					}else{
						return false;
					}
				}

			},
			getAll: () => {
				return this._currentFeeds;
			},
			list: (parsed = false) => {

				if(parsed){
					return Array.from(Object.keys(this._currentFeeds), (el) =>this._url.parse(el));
				}else{
					return Array.from(Object.keys(this._currentFeeds));
				}

			},
			remove: (feed) => {

				if(typeof feed === "number"){

					let feeds = Object.keys(this._currentFeeds);

					if(feeds[feed]){
						delete this._currentFeeds[feeds[feed]];
						return true;
					}else{
						return false;
					}

				}else{

					if(typeof this._currentFeeds[feed] !== "undefined"){
						delete this._currentFeeds[feed];
						return true;
					}else{
						return false;
					}
				}

			},
			has: (url) => {

				return !!this._currentFeeds[url];

			}
		}
	}

	getRSS(url){

		return new Promise((resolve, reject) => {

			this._axios.get(url).then(async (res) => {

				let data = this._xml.xml2js(res.data, {compact: true});
				let feed = this._convertFeed(data.feed ? data.feed : data.rss.channel, url);

				if(this.fetchExtraImages) {

					for (let i = 0; i < feed.items.length; i++){

						if (!feed.items[i].thumbnail || !feed.items[i].thumbnail.match(/png|jpg|jpeg/gi)) {
							let ogImage = await this._fetchExtraImages(feed.items[i].link);

							feed.items[i].thumbnail = ogImage;

						}

					}

					resolve(feed);

				}else{
					resolve(feed);
				}

			}).catch(err => reject(err));

		});

	}

	_convertFeed(data, source = null){

		let feed = {
			title: null,
			link: null,
			url: null,
			author: null,
			description: null,
			image: null,
			_source: source
		};


		let items = [];

		/*
		* Title
		* */
		feed.title = data.title._text;

		/*
		* Link
		* */
		if(Array.isArray(data.link)){

			let link = data.link.find(el => el._attributes.rel === "alternate");
			feed.link = link ? link._attributes.href : null;

		}else if(data.link._text){
			feed.link = data.link._text;
		}

		/*
		* URL
		* */
		if(Array.isArray(data.link)){

			let link = data.link.find(el => el._attributes.rel === "self");
			feed.url = link ? link._attributes.href : null;

		}

		/*
		* Author
		* */
		if(data.author && data.author._text){
			feed.author = data.author._text;
		}else if(data.author && data.author.name){
			feed.author = data.author.name._text;
		}

		/*
		* Description
		* */
		if(data.description){
			feed.description = data.description._text;
		}

		/*
		* Image
		* */
		if(data.image){
			feed.image = data.image.url._text;
		}


		/*
		* Items
		* */

		let thisitems = null;

		if(data.item){
			thisitems = data.item;
		}else if(data.entry){
			thisitems = data.entry;
		}

		if(thisitems && Array.isArray(thisitems)){

			let counter = 0;

			for(let entry of thisitems){

				let item = {
					title: null,
					pubDate: null,
					link: null,
					guid: null,
					author: null,
					thumbnail: null,
					description: null,
					content: null,
					categories: []
				};

				/*
				* Title
				* */
				if(entry.title._text){
					item.title = entry.title._text;
				}else if(entry.title._cdata){
					item.title = entry.title._cdata;
				}

				/*
				* pubDate
				* */
				if(entry.pubDate){
					item.pubDate = entry.pubDate._text;
				}else if(entry.published){
					item.pubDate = entry.published._text;
				}

				/*
				* Link
				* */
				if(Array.isArray(entry.link)){

					let link = data.link.find(el => el._attributes.rel === "alternate");
					feed.link = link ? link : null;

				}else if(entry.link._attributes){
					item.link = entry.link._attributes.href;
				}else if(entry.link._text){
					item.link = entry.link._text;
				}

				/*
				* GUID
				* */
				if(entry.guid){
					item.guid = entry.guid._text;
				}else if(entry.id){
					item.guid = entry.id._text;
				}

				/*
				* Author
				* */
				if(entry.author){

					if(entry.author.name){
						item.author = entry.author.name._text;
					}else if(entry.author._text){
						item.author = entry.author._text;
					}

				}else if(entry["dc:author"]){
					item.author = entry["dc:author"]._cdata;
				}

				/*
				* Thumbnail
				* */
				if(entry["media:group"] && entry["media:group"]["media:thumbnail"]){

					item.thumbnail = entry["media:group"]["media:thumbnail"]._attributes.url;

				}else if(entry["media:thumbnail"] && entry["media:thumbnail"]._attributes.url){

					item.thumbnail = entry["media:thumbnail"]._attributes.url

				}else if(entry["media:content"] && entry["media:content"]._attributes && entry["media:content"]._attributes.url){

					item.thumbnail = entry["media:content"]._attributes.url

				}else if(entry["content:encoded"]){

					let thumbnail = /src="([^ ]+)"/gi.exec(entry["content:encoded"]._cdata);
					if(thumbnail){
						item.thumbnail = thumbnail[1];
					}

				}

				/*
				* Description
				* */
				if(entry.description && entry.description._text){
					item.description = entry.description._text;
				}else if(entry.description && entry.description._cdata){
					item.description = entry.description._cdata;
				}else if(entry["media:group"] && entry["media:group"]["media:description"]){
					item.description = entry["media:group"]["media:description"]._text;
				}

				/*
				* Content
				* */
				if(entry["content:encoded"]){
					if(entry["content:encoded"]._text){
						item.content = entry["content:encoded"]._text;
					}else if(entry["content:encoded"]._cdata){
						item.content = entry["content:encoded"]._cdata;
					}
				}

				/*
				* Categories
				* */
				if(entry.category && entry.category._text){
					item.categories.push(entry.category._text);
				}else if(Array.isArray(entry.category)){
					for(let cat of entry.category){
						if(cat._cdata){
							item.categories.push(cat._cdata);
						}
					}
				}

				items.push(item);

				//Item limit
				if(this.itemLimit && counter >= this.itemLimit-1){
					break;
				}
				counter++;

			}

		}else{
			items = null;
		}

		return {
			feed: feed,
			items: items
		};

	}

	_fetchExtraImages(url){

		return new Promise((resolve, reject) => {

			if(this.cacheImages){
				if(this._imageCache[url]){
					resolve(this._imageCache[url]);
					return;
				}
			}

			this._axios.get(url)
				.then(res => {

					let ogImage = /"og:image"[^<>]+content="([^ ]+)"/gi.exec(res.data);
					ogImage = ogImage ? ogImage[1] : null;

					if(this.cacheImages){
						this._imageCache[url] = ogImage;
					}

					resolve(ogImage);

				})
				.catch(err => reject(err));

		});


	}

	filter(func){

		if(typeof func === "function"){

			this._filterFunction = func;

		}else{
			return false;
		}

	}

}

module.exports = BetterRSS;