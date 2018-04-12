package com.winterwell.ical;


import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.winterwell.utils.time.Dt;
import com.winterwell.utils.time.Period;
import com.winterwell.utils.time.Time;

public class ICalEvent {

	public Time start;
	public Time end;
	public String summary;
	public String uid;
	public Time created;
	public String location;
	public String raw;
	public Repeat repeat;
	public ICalEvent parent;
	
	public ICalEvent() {
	}
	
	public ICalEvent(Time start, Time end, String summary) {
		this.start = start;
		this.end = end;
		this.summary = summary;
	}

	@Override
	public String toString() {
		return "BEGIN:VEVENT\r\n"
				+"DTSTART:"+start+"\r\n" // FIXME What is the format???
				+"DTEND:"+end+"\r\n"
				+"SUMMARY:"+summary+"\r\n"
				+"END:VEVENT\r\n";
	}

	public boolean isRepeating() {
		return repeat!=null;
	}

	/**
	 * @param start
	 * @param end
	 * @return All repeats within start and end, if it is repeating.
	 * If not -- return null.
	 */
	public List<ICalEvent> getRepeats(Time rstart, Time rend) {
		if (repeat==null) return null;
		List<Time> repeatPeriods = repeat.getRepeats(rstart, rend);
		List<ICalEvent> repeatEvents = new ArrayList();
		Dt dt = start.dt(end);
		for (Time t : repeatPeriods) {			
			ICalEvent e2 = new ICalEvent(t, t.plus(dt), summary);
			e2.location = location;
			e2.parent = this;
			repeatEvents.add(e2);
		}
		return repeatEvents;
	}
}
