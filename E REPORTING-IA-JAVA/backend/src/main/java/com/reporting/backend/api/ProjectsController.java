package com.reporting.backend.api;

import com.reporting.backend.data.DataStore;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/projects")
public class ProjectsController {
	@GetMapping
	public Collection<Map<String,Object>> list(){ return DataStore.projects.values(); }
	@PostMapping
	public Map<String,Object> create(@RequestBody Map<String,Object> body){
		String id = UUID.randomUUID().toString();
		Map<String,Object> p = new HashMap<>(body);
		p.put("id", id);
		DataStore.projects.put(id, p);
		return p;
	}
	@PutMapping("/{id}")
	public Map<String,Object> update(@PathVariable String id, @RequestBody Map<String,Object> body){
		Map<String,Object> p = new HashMap<>(DataStore.projects.get(id));
		p.putAll(body);
		p.put("id", id);
		DataStore.projects.put(id, p);
		return p;
	}
	@DeleteMapping("/{id}")
	public void delete(@PathVariable String id){ DataStore.projects.remove(id); }
}