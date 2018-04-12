package com.winterwell.calstat;

import com.winterwell.utils.io.Option;
import com.winterwell.web.app.ISiteConfig;

public class CalstatConfig implements ISiteConfig {

	@Option
	public int port = 8652;
	
	public static final String appName = "calstat";

	@Override
	public int getPort() {
		return port;
	}
	
}
