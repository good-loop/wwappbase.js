package com.winterwell.calstat;

import java.util.function.Supplier;

import javax.servlet.http.HttpServlet;

import com.winterwell.web.WebEx;
import com.winterwell.web.app.HttpServletWrapper;
import com.winterwell.web.app.IServlet;
import com.winterwell.web.app.WebRequest;

/**
 * Status: not used
 * @author daniel
 *
 */
public class RouterServlet extends HttpServletWrapper {

	public RouterServlet() {
		super((Supplier)null);
	}

	private static final long serialVersionUID = 1L;

	@Override
	protected IServlet getServlet(WebRequest state) {
		// Pick by path top
		String pathTop = state.getSlugBits(0);
		
		if ("calstat".equals(pathTop)) {
			return new CalstatServlet();	
		}
		
		// what else to do?!
		throw new WebEx.E404(state.getRequestUrl());		
	}
	
}
