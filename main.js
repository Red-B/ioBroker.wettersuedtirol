"use strict";

/*
 * Created with @iobroker/create-adapter v1.32.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const fetch = require("node-fetch");

// Load your modules here, e.g.:
// const fs = require("fs");

class Wettersuedtirol extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "wettersuedtirol",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info("config option1: " + this.config.option1);
		this.log.info("config option2: " + this.config.option2);
		const settings = { method: "Get" };


		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/

		const selber = this;

		setInterval(function () {

			//Aktuelle Werte
			const url = "http://daten.buergernetz.bz.it/services/meteo/v1/sensors?station_code=27100MS";
			fetch(url, settings)
				.then(res => res.json())
				.then((json) =>  {
					//inside(json, "json");
					for (const werte in json) {
						try {
							selber.setObjectNotExists("aktuelleWerte." + json[werte].DESC_D, { type: "state", common: { name: "aktuelleWerte." + json[werte].DESC_D, type: "number", role: "indicator", unit: json[werte].UNIT, read: true, write: true, }, native: {}, });
							selber.setState("aktuelleWerte." + json[werte].DESC_D, { val: json[werte].VALUE, ack: true });
							selber.log.info(json[werte].DESC_D + ":" + json[werte].VALUE);
						} catch (e) {
							selber.setState("aktuelleWerte." + json[werte].DESC_D, { val: json[werte].VALUE, ack: true });
							selber.log.info(json[werte].DESC_D + ":" + json[werte].VALUE);}
					}
					// do something with JSON
				});

			//Wetter Bezirk

			const url2 = "http://daten.buergernetz.bz.it/services/weather/district/2/bulletin?format=json&lang=de";

			fetch(url2, settings)
				.then(res => res.json())
				.then((Prognosebezirk) => {

					inside(Prognosebezirk, "Vorhersage.Bezirk");


				});

			//Wetter Land

			const url3 = "http://daten.buergernetz.bz.it/services/weather/bulletin?format=json&lang=de";

			fetch(url3, settings)
				.then(res => res.json())
				.then((Prognoseland) => {

					inside(Prognoseland, "Vorhersage.Land");


					// do something with JSON
				});

		}, 300000);



		function inside(events, hierarchie) {
			for (const i in events) {
				if (typeof events[i] === "object") {
					inside(events[i], hierarchie + "." + i);
				}
				else {
					selber.setObjectNotExists(hierarchie + "." + i, { type: "state", common: { name: hierarchie + "." + i, type: "mixed", role: "indicator", read: true, write: false, }, native: {}, });
					selber.setState(hierarchie + "." + i, { val: events[i], ack: true });
					selber.log.info(hierarchie + "." + i + ":" + events[i]);
				}
			}
		}


		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.


		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw iobroker: " + result);

		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Wettersuedtirol(options);
} else {
	// otherwise start the instance directly
	new Wettersuedtirol();
}