package com.reporting.backend.api;

import com.reporting.backend.data.DataStore;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/elearning")
public class ELearningController {
	@GetMapping("/courses")
	public Collection<Map<String,Object>> list(){ return DataStore.courses.values(); }
	@PostMapping("/courses")
	public Map<String,Object> create(@RequestBody Map<String,Object> body){
		String id = UUID.randomUUID().toString();
		Map<String,Object> c = new HashMap<>(body);
		c.put("id", id);
		DataStore.courses.put(id, c);
		return c;
	}
}