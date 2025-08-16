package com.reporting.backend.api;

import com.reporting.backend.data.DataStore;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/documents")
public class DocumentsController {
	public static final Map<String, Map<String,Object>> documents = new HashMap<>();

	@GetMapping
	public Collection<Map<String,Object>> list(@RequestParam Optional<String> entityId, @RequestParam Optional<String> sessionId, @RequestParam Optional<String> category){
		return documents.values().stream().filter(d ->
			entityId.map(v -> Objects.equals(d.get("entityId"), v)).orElse(true)
			&& sessionId.map(v -> Objects.equals(d.get("sessionId"), v)).orElse(true)
			&& category.map(v -> Objects.equals(d.get("category"), v)).orElse(true)
		).toList();
	}
	@PostMapping
	public Map<String,Object> create(@RequestBody Map<String,Object> body){
		String id = UUID.randomUUID().toString();
		Map<String,Object> d = new HashMap<>(body);
		d.put("id", id);
		d.putIfAbsent("category","elaboration");
		d.putIfAbsent("title","Document");
		d.putIfAbsent("content","# Nouveau document\n");
		d.put("status", "Brouillon");
		d.put("history", new ArrayList<Map<String,Object>>());
		documents.put(id, d);
		return d;
	}
	@PutMapping("/{id}")
	public Map<String,Object> update(@PathVariable String id, @RequestBody Map<String,Object> body){
		Map<String,Object> d = new HashMap<>(documents.get(id));
		d.putAll(body);
		documents.put(id, d);
		return d;
	}
	@DeleteMapping("/{id}")
	public void delete(@PathVariable String id){ documents.remove(id); }

	@PostMapping("/{id}/submit")
	public Map<String,Object> submit(@PathVariable String id){
		Map<String,Object> d = documents.get(id);
		if (d == null) throw new RuntimeException("Document introuvable");
		d.put("status","Soumis");
		addHistory(d, "Soumission");
		NotificationsController.addNotification(Map.of("type","document","message","Document soumis: "+d.get("title")));
		return d;
	}
	@PostMapping("/{id}/approve")
	public Map<String,Object> approve(@PathVariable String id){
		Map<String,Object> d = documents.get(id);
		if (d == null) throw new RuntimeException("Document introuvable");
		d.put("status","Approuvé");
		addHistory(d, "Approbation");
		NotificationsController.addNotification(Map.of("type","document","message","Document approuvé: "+d.get("title")));
		return d;
	}
	@PostMapping("/{id}/reject")
	public Map<String,Object> reject(@PathVariable String id, @RequestBody(required = false) Map<String,Object> body){
		Map<String,Object> d = documents.get(id);
		if (d == null) throw new RuntimeException("Document introuvable");
		d.put("status","Rejeté");
		addHistory(d, "Rejet" + (body!=null && body.get("reason")!=null ? ": "+body.get("reason") : ""));
		NotificationsController.addNotification(Map.of("type","document","message","Document rejeté: "+d.get("title")));
		return d;
	}

	@SuppressWarnings("unchecked")
	private void addHistory(Map<String,Object> d, String action){
		List<Map<String,Object>> h = (List<Map<String,Object>>) d.get("history");
		h.add(Map.of("date", new Date().toString(), "action", action));
	}
}