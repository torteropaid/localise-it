function PubSubWebsocket(addr) {

	this.cli = new WebSocket(addr);
	this.callbacks = {};

	this.cli.onmessage = function(msg){
		var data = JSON.parse(msg.data);
		app.adapter.socketIncome(data.topic, data);
	};

	this.cli.onerror = function(msg){
		console.log("error: ",msg);
	};

	this.cli.onclose = function(msg){
		console.log("close: ",msg);
	};

	this.sendObject = function(data){
		this.cli.send(JSON.stringify(data));
	};

	this.subscribe = function(topic){
		var obj = {
			"subscribe" : true,
			"topic" : topic
		};
		this.sendObject(obj);
	};

	this.unsubscribe = function(topic){
		var obj = {
			"unsubscribe" : true,
			"topic" : topic
		};
		this.sendObject(obj);
	};

	this.publish = function(topic,data){
		var obj = {
			"publish" : true,
			"topic" : topic,
			"data" : data
		};
		this.sendObject(obj);
	};

	this.registerCallback = function(topic,callback){
		var list = this.callbacks[topic];
		if (list === undefined) {
			list = [];
			list.push(callback);
			this.callbacks[topic] = list;
		}
		else {
			list.push(callback);
			this.callbacks[topic] = list;
		}
	};
}
