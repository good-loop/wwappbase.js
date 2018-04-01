
SJTest.run({name:'DataStore',

	simpleTest: function() {
		DataStore.setValue(['misc','foo'], 'FOO :)');
		let foo = DataStore.getValue(['misc','foo']);
		assert(foo === "FOO :)", foo);
		return foo;
	},	

});