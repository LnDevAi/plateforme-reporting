package com.reporting.backend.api;

import com.reporting.backend.data.DataStore;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/entities")
public class EntitiesController {
	@GetMapping
	public Collection<Map<String,Object>> list(){ return DataStore.entities.values(); }

	@PostMapping
	public Map<String,Object> create(@RequestBody Map<String,Object> body){
		String id = UUID.randomUUID().toString();
		Map<String,Object> e = new HashMap<>(body);
		e.put("id", id);
		DataStore.entities.put(id, e);
		return e;
	}

	@GetMapping("/{id}")
	public Map<String,Object> get(@PathVariable String id){ return DataStore.entities.get(id); }

	@PutMapping("/{id}")
	public Map<String,Object> update(@PathVariable String id, @RequestBody Map<String,Object> body){
		Map<String,Object> e = new HashMap<>(DataStore.entities.get(id));
		e.putAll(body);
		e.put("id", id);
		DataStore.entities.put(id, e);
		return e;
	}

	@DeleteMapping("/{id}")
	public void delete(@PathVariable String id){ DataStore.entities.remove(id); }

	@GetMapping("/catalog/epe")
	public List<String> epe(){ return DataStore.catalogEpe; }
	@GetMapping("/catalog/se")
	public List<String> se(){ return DataStore.catalogSe; }
}