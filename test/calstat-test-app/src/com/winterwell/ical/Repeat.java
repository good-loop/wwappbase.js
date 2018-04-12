package com.winterwell.ical;


import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;

import com.winterwell.utils.TodoException;
import com.winterwell.utils.Utils;
import com.winterwell.utils.time.Period;
import com.winterwell.utils.time.TUnit;
import com.winterwell.utils.time.Time;

import com.winterwell.utils.containers.ArrayMap;
import com.winterwell.utils.containers.Containers;
import com.winterwell.utils.log.Log;

/**
 * See http://www.kanzaki.com/docs/ical/rrule.html
 * @author daniel
 *
 */
public class Repeat {
	
	
	@Override
	public String toString() {
		// TODO a better tostring
		return "every "+(interval==1?"":interval+" ")+freq.toString().toLowerCase()+"(s)";
	}

	String rrule;
	TUnit freq;
	Time since;
	Time until;
	/**
	 * Can be comma separated. Can have a number prefix, eg 1FR = first firday
	 */
	private String byday;
	/**
	 * e.g. 2 = every other day/week/etc
	 */
	private int interval = 1;
	private int count;
	private String bymonth;
	/**
	 * e.g. on the 5th of each month
	 */
	private String bymonthday;
	private List<Time> exclude;
	
	public Repeat(String rrule) {
		this.rrule= rrule;
		try {
			parse();
		} catch (ParseException e) {
			throw Utils.runtime(e);
		}
	}

	private void parse() throws ParseException {
		// e.g. FREQ=WEEKLY;UNTIL=20160722T160000Z;INTERVAL=6;BYDAY=FR
		String[] bits = rrule.split(";");
		for (String bit : bits) {
			String[] kv = bit.split("=");
			if (kv.length!=2) {
				Log.e("ical", "odd rrule "+rrule);
				continue;
			}
			String v = kv[1];
			switch(kv[0]) {
			case "FREQ":
				freq = (TUnit) new ArrayMap("DAILY", TUnit.DAY, "WEEKLY", TUnit.WEEK, "MONTHLY", TUnit.MONTH, "YEARLY", TUnit.YEAR).get(v);
				break;
			case "UNTIL":
				until = ICalReader.parseTime(v, null);
				break;
			case "BYDAY":
				byday = v;
				break;
			case "BYMONTH":
				bymonth = v;
				break;
			case "BYMONTHDAY":
				bymonthday = v;
				break;
			case "INTERVAL":
				interval = Integer.valueOf(v);
				break;
			case "COUNT":
				count = Integer.valueOf(v);
				break;
			}
		}
	}

	public List<Time> getRepeats(Time start, Time end) {
		assert interval>0;
		Time mark = since;
		List<Time> periods = new ArrayList();
		int cnt = 0;
		while(mark.isBeforeOrEqualTo(end)) {
			if (mark.isAfterOrEqualTo(start)) {
				// TODO filter byday etc
				periods.add(mark);
			}
			
			cnt++;
			if (count>0 && cnt==count) {
				break;
			}
			// done late, so we get the event itself included
			mark = mark.plus(interval, freq);			
		}
		// remove excludes
		if (exclude != null) {			
			for(Time ex : exclude) {
				if (ex.isBefore(start)) continue;
				if (ex.isAfter(end)) continue;
				// is equals enough, or do we have to cover a window??
				periods = Containers.filter(periods, p -> ! ex.equals(p));
			}
		}
		return periods;
	}

	public void addExclude(Time exdate) {
		if (exclude==null) exclude = new ArrayList();
		exclude.add(exdate);
	}

}
