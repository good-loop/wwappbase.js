package com.winterwell.calstat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.winterwell.ical.ICalEvent;
import com.winterwell.ical.ICalReader;
import com.winterwell.maths.stats.distributions.discrete.ObjectDistribution;
import com.winterwell.nlp.io.Tkn;
import com.winterwell.nlp.io.WordAndPunctuationTokeniser;
import com.winterwell.nlp.query.SearchQuery;
import com.winterwell.utils.Constant;
import com.winterwell.utils.StrUtils;
import com.winterwell.utils.containers.ArrayMap;
import com.winterwell.utils.log.Log;
import com.winterwell.utils.threads.ICallable;
import com.winterwell.utils.time.Dt;
import com.winterwell.utils.time.OfficeHours;
import com.winterwell.utils.time.OfficeHoursPeriod;
import com.winterwell.utils.time.Period;
import com.winterwell.utils.time.TUnit;
import com.winterwell.utils.time.Time;
import com.winterwell.utils.time.TimeUtils;
import com.winterwell.utils.web.WebUtils2;
import com.winterwell.web.FakeBrowser;
import com.winterwell.web.ajax.JsonResponse;
import com.winterwell.web.app.CommonFields;
import com.winterwell.web.app.IServlet;
import com.winterwell.web.app.WebRequest;
import com.winterwell.web.fields.Checkbox;
import com.winterwell.web.fields.DoubleField;

public class CalstatServlet implements IServlet {

	private static final Checkbox OFFICE_ONLY = new Checkbox("officeHoursOnly");
	private static final String LOGTAG = "calstat";

	@Override
	public void process(WebRequest state) throws Exception {
		WebUtils2.CORS(state, false);
		String url = state.get("icalfeed");
		FakeBrowser fb = new FakeBrowser();
		String ical = fb.getPage(url);
		ICalReader r = new ICalReader(ical);
		List<ICalEvent> events = r.getEvents();
		ICallable<Time> start = state.get(CommonFields.START, new Constant<>(TimeUtils.WELL_OLD));
		ICallable<Time> until = state.get(CommonFields.END, new Constant<>(new Time()));
		
		String filter = state.get("q");
		SearchQuery ss = filter==null? null : new SearchQuery(filter);
		
		double hoursPerDay = state.get(new DoubleField("hoursPerDay"), 8.0);
		
		Period period = new Period(start.call(), until.call());
		Dt sum = TimeUtils.NO_TIME_AT_ALL;
		Dt overlaps = TimeUtils.NO_TIME_AT_ALL;
		int days = 0;
		List<String> log =new ArrayList();
		ObjectDistribution od = new ObjectDistribution();
		
		WordAndPunctuationTokeniser tkr = new WordAndPunctuationTokeniser();
		tkr.setSwallowPunctuation(true);
		tkr.setLowerCase(true);
		int items = 0;
		OfficeHours oh = new OfficeHours(TimeUtils._GMT_TIMEZONE);
		boolean officeOnly = state.get(OFFICE_ONLY);
		
		List<Period> alreadyCounted = new ArrayList(); // for overlap tracking
		
		// add in repeats
		List<ICalEvent> eventsPlusRepeats = new ArrayList();
		for (ICalEvent e : events) {
			if (e.isRepeating()) {
				List<ICalEvent> repeats = e.getRepeats(period.first, period.second);
				eventsPlusRepeats.addAll(repeats);
			} else {
				eventsPlusRepeats.add(e);
			}
		}
		
		
		for (ICalEvent e : eventsPlusRepeats) {
			if (e.start==null) continue;
			if ( ! period.contains(e.start)) {		
				continue;
			}
			// filter
			String s = StrUtils.joinWithSkip(" ", e.summary, e.location);
			if (ss != null && ! ss.matches(s)) {
				Log.d(LOGTAG, "skip (no match) "+e);
				continue;
			}
			Dt dt = null;
			Time end = e.end;
			if (end==null) {
				// assume 1 hour 
				end = e.start.plus(TUnit.HOUR);
			}
			dt = e.start.dt(end);								
			if (dt.equals(TUnit.DAY.dt)) {
				days++;
				dt = new Dt(hoursPerDay, TUnit.HOUR);
			} else if (officeOnly) {
				OfficeHoursPeriod ohp = new OfficeHoursPeriod(oh, e.start, end);
				dt = ohp.getTotalOfficeTime();
				sum = sum.plus(dt);
			} else {
				// use raw time period
				sum = sum.plus(dt);
			}	
			// overlap?
			Period eperiod = new Period(e.start, end);
			Dt idt = null;
			for(Period p : alreadyCounted) {
				Period intersect = eperiod.intersect(p);
				if (intersect==null || intersect.length().getValue()==0) continue;
				// TODO This is not quite correct for office-hours! We should keep track of the periods that counted
				idt = intersect.length();
				if (dt.isShorterThan(idt)) idt = dt;
				overlaps = overlaps.plus(idt);
				Log.d(LOGTAG, "Overlap "+idt+" from "+p+" vs "+e);
				// TODO this break avoids double-counting if 3 events overlap. But it is not 100% correct!
				Log.d(LOGTAG, "...break from already counted loop "+e);
				break;
			}
			alreadyCounted.add(eperiod);
			
			WordAndPunctuationTokeniser tokens = tkr.factory(s);
			for (Tkn tkn : tokens) {
				od.train1(tkn.getText(), dt.convertTo(TUnit.HOUR).getValue());
			}
						
			items++;
			Log.d(LOGTAG, e.start+"	"+e.end+"	"+s+"	"+dt.convertTo(TUnit.HOUR)+(idt==null?"":" - overlap of "+idt.convertTo(TUnit.HOUR)));
			log.add(
					e.start+"	"+e.end+"	"+s+"	"+dt.convertTo(TUnit.HOUR)+(idt==null?"":" - overlap of "+idt.convertTo(TUnit.HOUR))
					+(e.parent==null?"":" repeating "+e.parent.repeat)
					);
		}
		Dt hours = sum.convertTo(TUnit.HOUR);
		overlaps = overlaps.convertTo(TUnit.HOUR);

		String name = r.getCalendarName();
		
		Map cargo = new ArrayMap(
			"name", name,
			"url", url,
			"alldays", days,
			"hours", hours.getValue() - overlaps.getValue(),
			"days", (days + (hours.getValue() - overlaps.getValue())/hoursPerDay),
			"items", items,
			"breakdown",od.asMap(),
			"log",log
			);
		if (overlaps.getValue() != 0) {
			cargo.put("overlaps", overlaps.getValue());
		}
		
		// send back
		JsonResponse jo = new JsonResponse(state, cargo);
		WebUtils2.sendJson(jo, state);
	}

}
