package com.reporting.backend.data;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class DataStore {
	public static final Map<String, Map<String,Object>> ministries = new ConcurrentHashMap<>();
	public static final Map<String, Map<String,Object>> entities = new ConcurrentHashMap<>();
	public static final Map<String, Map<String,Object>> projects = new ConcurrentHashMap<>();
	public static final Map<String, Map<String,Object>> users = new ConcurrentHashMap<>();
	public static final Map<String, Map<String,Object>> sessions = new ConcurrentHashMap<>();
	public static final List<String> catalogEpe = new ArrayList<>();
	public static final List<String> catalogSe = new ArrayList<>();

	static {
		seed();
	}

	public static void seed(){
		if (!ministries.isEmpty()) return;
		String min1 = UUID.randomUUID().toString();
		ministries.put(min1, Map.of(
			"id", min1,
			"sigle", "MF",
			"name", "Ministère des Finances",
			"minister", "Ministre des Finances"
		));
		String ent1 = UUID.randomUUID().toString();
		entities.put(ent1, new HashMap<>(Map.of(
			"id", ent1,
			"name", "EPE Démo",
			"type", "EPE",
			"ministryId", min1
		)));
		String proj1 = UUID.randomUUID().toString();
		projects.put(proj1, Map.of(
			"id", proj1,
			"name", "Projet Démo",
			"entityId", ent1
		));
		String user1 = UUID.randomUUID().toString();
		users.put(user1, Map.of(
			"id", user1,
			"email", "admin@demo.local",
			"firstName", "Admin",
			"lastName", "Démo",
			"roles", List.of("ADMIN")
		));
		// Catalogs
		catalogEpe.addAll(List.of(
			"EPE - Office National A",
			"EPE - Agence Technique B",
			"EPE - Centre C"
		));
		catalogSe.addAll(List.of(
			"Société d'État - Entreprise X",
			"Société d'État - Société Y"
		));
	}
}