

package com.winterwell.calstat;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import javax.servlet.http.HttpServlet;

import com.winterwell.gson.Gson;
import com.winterwell.gson.GsonBuilder;
import com.winterwell.gson.KLoopPolicy;
import com.winterwell.gson.StandardAdapters;
import com.winterwell.utils.Dep;
import com.winterwell.utils.containers.ArrayMap;
import com.winterwell.utils.containers.ArraySet;
import com.winterwell.utils.io.ArgsParser;
import com.winterwell.utils.log.Log;
import com.winterwell.utils.log.LogFile;
import com.winterwell.utils.time.TUnit;
import com.winterwell.utils.time.Time;
import com.winterwell.utils.web.WebUtils2;
import com.winterwell.web.app.AMain;
import com.winterwell.web.app.AppUtils;
import com.winterwell.web.app.HttpServletWrapper;
import com.winterwell.web.app.JettyLauncher;
import com.winterwell.web.app.ManifestServlet;
import com.winterwell.web.data.XId;
import com.winterwell.youagain.client.YouAgainClient;

public class CalstatMain extends AMain<CalstatConfig> {

	public static void main(String[] args) {
		new CalstatMain().doMain(args);
	}

	
	@Override
	protected void addJettyServlets(JettyLauncher jl) {
		super.addJettyServlets(jl);
		jl.addServlet("/calstat", new HttpServletWrapper(CalstatServlet::new));
	}
	

	@Override
	protected CalstatConfig init2_config(String[] args) {
		CalstatConfig pc = new CalstatConfig();
		pc = AppUtils.getConfig(appName, pc, args);
				
		Dep.set(YouAgainClient.class, new YouAgainClient(config.appName));
		
		return pc;
	}

}
