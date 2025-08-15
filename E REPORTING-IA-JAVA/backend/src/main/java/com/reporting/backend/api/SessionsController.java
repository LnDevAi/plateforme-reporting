package com.reporting.backend.api;

import com.reporting.backend.data.DataStore;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/sessions")
public class SessionsController {
	@GetMapping
	public Collection<Map<String,Object>> list(){ return DataStore.sessions.values(); }
	@PostMapping
	public Map<String,Object> create(@RequestBody Map<String,Object> body){
		String id = UUID.randomUUID().toString();
		Map<String,Object> s = new HashMap<>(body);
		s.put("id", id);
		s.putIfAbsent("type","budgetaire");
		s.putIfAbsent("entityId", null);
		s.put("deliberations", new ArrayList<>());
		s.put("meetings", new ArrayList<>());
		DataStore.sessions.put(id, s);
		return s;
	}
	@PostMapping("/{id}/deliberations")
	public List<Map<String,Object>> addDelib(@PathVariable String id, @RequestBody Map<String,Object> body){
		Map<String,Object> s = DataStore.sessions.get(id);
		List<Map<String,Object>> delibs = (List<Map<String,Object>>) s.get("deliberations");
		Map<String,Object> d = new HashMap<>(body);
		d.put("id", UUID.randomUUID().toString());
		d.putIfAbsent("title","Délibération");
		d.putIfAbsent("status","Brouillon");
		delibs.add(d);
		return delibs;
	}
	@GetMapping("/{id}/deliberations")
	public List<Map<String,Object>> listDelib(@PathVariable String id){
		return (List<Map<String,Object>>) DataStore.sessions.get(id).get("deliberations");
	}
	@PostMapping("/{id}/meetings")
	public List<Map<String,Object>> addMeeting(@PathVariable String id, @RequestBody Map<String,Object> body){
		Map<String,Object> s = DataStore.sessions.get(id);
		List<Map<String,Object>> meetings = (List<Map<String,Object>>) s.get("meetings");
		Map<String,Object> m = new HashMap<>(body);
		m.put("id", UUID.randomUUID().toString());
		m.putIfAbsent("room","reporting-"+id);
		m.putIfAbsent("provider","jitsi");
		meetings.add(m);
		return meetings;
	}
	@GetMapping("/{id}/meetings")
	public List<Map<String,Object>> listMeetings(@PathVariable String id){
		return (List<Map<String,Object>>) DataStore.sessions.get(id).get("meetings");
	}
}