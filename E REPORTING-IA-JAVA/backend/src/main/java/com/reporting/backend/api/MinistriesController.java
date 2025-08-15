package com.reporting.backend.api;

import com.reporting.backend.data.DataStore;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/ministries")
public class MinistriesController {
	@GetMapping
	public Collection<Map<String,Object>> list(){ return DataStore.ministries.values(); }

	@PostMapping
	public Map<String,Object> create(@RequestBody Map<String,Object> body){
		String id = UUID.randomUUID().toString();
		Map<String,Object> m = new HashMap<>(body);
		m.put("id", id);
		DataStore.ministries.put(id, m);
		return m;
	}

	@GetMapping("/{id}")
	public Map<String,Object> get(@PathVariable String id){ return DataStore.ministries.get(id); }

	@PutMapping("/{id}")
	public Map<String,Object> update(@PathVariable String id, @RequestBody Map<String,Object> body){
		Map<String,Object> m = new HashMap<>(DataStore.ministries.get(id));
		m.putAll(body);
		m.put("id", id);
		DataStore.ministries.put(id, m);
		return m;
	}

	@DeleteMapping("/{id}")
	public void delete(@PathVariable String id){ DataStore.ministries.remove(id); }
}