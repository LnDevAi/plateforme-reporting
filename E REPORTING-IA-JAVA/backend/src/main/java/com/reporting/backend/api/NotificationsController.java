package com.reporting.backend.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationsController {
	public static final List<Map<String,Object>> notifications = new ArrayList<>();

	public static void addNotification(Map<String,Object> n){
		n.putIfAbsent("id", UUID.randomUUID().toString());
		n.putIfAbsent("createdAt", new Date().toString());
		notifications.add(n);
	}

	@GetMapping
	public List<Map<String,Object>> list(){
		return notifications;
	}
}