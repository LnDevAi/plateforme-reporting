package com.reporting.backend.api;

import com.reporting.backend.data.DataStore;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UsersController {
	@GetMapping
	public Collection<Map<String,Object>> list(){ return DataStore.users.values(); }
	@PostMapping
	public Map<String,Object> create(@RequestBody Map<String,Object> body){
		String id = UUID.randomUUID().toString();
		Map<String,Object> u = new HashMap<>(body);
		u.put("id", id);
		DataStore.users.put(id, u);
		return u;
	}
	@PutMapping("/{id}")
	public Map<String,Object> update(@PathVariable String id, @RequestBody Map<String,Object> body){
		Map<String,Object> u = new HashMap<>(DataStore.users.get(id));
		u.putAll(body);
		u.put("id", id);
		DataStore.users.put(id, u);
		return u;
	}
	@DeleteMapping("/{id}")
	public void delete(@PathVariable String id){ DataStore.users.remove(id); }
}