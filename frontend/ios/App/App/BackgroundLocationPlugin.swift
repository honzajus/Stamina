import Foundation
import Capacitor
import CoreLocation

@objc(BackgroundLocationPlugin)
public class BackgroundLocationPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "BackgroundLocationPlugin"
    public let jsName = "BackgroundLocation"
    public let pluginMethods: [CAPPluginMethod] = [
        .init(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        .init(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        .init(name: "getCurrentPosition", returnType: CAPPluginReturnPromise),
        .init(name: "watchPosition", returnType: CAPPluginReturnCallback),
        .init(name: "clearWatch", returnType: CAPPluginReturnPromise)
    ]

    private let locationManager = CLLocationManager()
    private var watchCallbackId: String?
    private var permissionCall: CAPPluginCall?
    private var currentPositionCall: CAPPluginCall?

    override public func load() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.activityType = .fitness
        locationManager.distanceFilter = kCLDistanceFilterNone
        locationManager.pausesLocationUpdatesAutomatically = false

        let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String] ?? []
        if backgroundModes.contains("location") {
            locationManager.allowsBackgroundLocationUpdates = true
        }
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        let status = locationManager.authorizationStatus
        if status == .notDetermined {
            permissionCall = call
            locationManager.requestAlwaysAuthorization()
        } else {
            call.resolve(statusResult(for: status))
        }
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(statusResult(for: locationManager.authorizationStatus))
    }

    @objc func getCurrentPosition(_ call: CAPPluginCall) {
        guard isAuthorized() else {
            call.reject("Location permission not granted")
            return
        }
        currentPositionCall = call
        locationManager.requestLocation()
    }

    @objc func watchPosition(_ call: CAPPluginCall) {
        guard isAuthorized() else {
            call.reject("Location permission not granted")
            return
        }
        call.keepAlive = true
        watchCallbackId = call.callbackId
        bridge?.saveCall(call)
        locationManager.startUpdatingLocation()
    }

    @objc func clearWatch(_ call: CAPPluginCall) {
        if let id = watchCallbackId {
            bridge?.releaseCall(withID: id)
        }
        watchCallbackId = nil
        locationManager.stopUpdatingLocation()
        call.resolve()
    }

    private func isAuthorized() -> Bool {
        let status = locationManager.authorizationStatus
        return status == .authorizedAlways || status == .authorizedWhenInUse
    }

    private func statusResult(for status: CLAuthorizationStatus) -> PluginCallResultData {
        let value: String
        switch status {
        case .authorizedAlways, .authorizedWhenInUse: value = "granted"
        case .denied, .restricted: value = "denied"
        default: value = "prompt"
        }
        return ["location": value]
    }

    private func positionResult(for location: CLLocation) -> PluginCallResultData {
        return [
            "timestamp": Int(location.timestamp.timeIntervalSince1970 * 1000),
            "coords": [
                "latitude": location.coordinate.latitude,
                "longitude": location.coordinate.longitude,
                "accuracy": location.horizontalAccuracy,
                "altitude": location.altitude,
                "altitudeAccuracy": location.verticalAccuracy,
                "speed": location.speed >= 0 ? (location.speed as Any) : (NSNull() as Any),
                "heading": location.course >= 0 ? (location.course as Any) : (NSNull() as Any)
            ]
        ]
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        let result = positionResult(for: location)

        if let currentCall = currentPositionCall {
            currentCall.resolve(result)
            currentPositionCall = nil
        }

        if let id = watchCallbackId, let watchCall = bridge?.savedCall(withID: id) {
            watchCall.resolve(result)
        }
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        currentPositionCall?.reject(error.localizedDescription)
        currentPositionCall = nil

        if let id = watchCallbackId, let watchCall = bridge?.savedCall(withID: id) {
            watchCall.reject(error.localizedDescription)
        }
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if let call = permissionCall {
            call.resolve(statusResult(for: manager.authorizationStatus))
            permissionCall = nil
        }
    }
}
