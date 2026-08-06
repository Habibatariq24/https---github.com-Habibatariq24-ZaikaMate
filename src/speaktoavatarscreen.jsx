import React, { useEffect, useState, useRef } from "react";
import "./styles.css";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import * as THREE from "three";

// ================= CONFIG =================

const BACKEND_URL = "http://localhost:8000";

const BACKGROUND_IMAGE =
  "https://raw.githubusercontent.com/Habibatariq24/fyp/main/pink4.webp";

const SET_MODEL =
  "https://raw.githubusercontent.com/Habibatariq24/fyp/main/set2.glb";

const HAT_MODEL =
  "https://raw.githubusercontent.com/Habibatariq24/fyp/main/hat.glb";

const isMobile = typeof window !== "undefined" && window.innerWidth < 600;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const AVATAR_GROUND_Y = isMobile ? -2.15 : -2.5;

const AVATAR_MIN_X = isMobile ? -1.2 : -3.7;
const AVATAR_MAX_X = isMobile ? 1.2 : 3.7;

const DRAG_BOX_WIDTH = isMobile ? 220 : 420;
const DRAG_BOX_HEIGHT = isMobile ? 420 : 620;
const DRAG_BOX_CENTER = DRAG_BOX_WIDTH / 2;

// ================= HORIZONTAL DRAG HOOK =================

function useDrag(initialPos = { x: 100, y: 100 }) {
  const [pos, setPos] = useState(initialPos);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    dragging.current = true;

    offset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };

    e.preventDefault();
  };

  const onTouchStart = (e) => {
    dragging.current = true;

    const t = e.touches[0];

    offset.current = {
      x: t.clientX - pos.x,
      y: t.clientY - pos.y,
    };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;

      const screenW = window.innerWidth;
      const newX = e.clientX - offset.current.x;

      setPos((prev) => ({
        x: clamp(newX, 20, screenW - DRAG_BOX_WIDTH - 10),
        y: prev.y,
      }));
    };

    const onTouchMove = (e) => {
      if (!dragging.current) return;

      const t = e.touches[0];
      const screenW = window.innerWidth;
      const newX = t.clientX - offset.current.x;

      setPos((prev) => ({
        x: clamp(newX, 20, screenW - DRAG_BOX_WIDTH - 10),
        y: prev.y,
      }));
    };

    const onUp = () => {
      dragging.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  return { pos, onMouseDown, onTouchStart };
}

// ================= MIC + AGENT AUDIO TRACK =================

function MicPublisher({ onStatus, onAgentAudioTrack }) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  useEffect(() => {
    if (!room || !localParticipant) return;

    let mounted = true;
    let micStarted = false;

    async function startMic() {
      if (micStarted) return;
      micStarted = true;

      try {
        onStatus("Requesting microphone...");

        await navigator.mediaDevices.getUserMedia({ audio: true });

        if (!mounted) return;

        await localParticipant.setMicrophoneEnabled(true);

        onStatus("🎤 Listening...");
        console.log("Mic published successfully");
      } catch (err) {
        console.error("Mic error:", err);
        onStatus("Mic error. Allow microphone permission.");
      }
    }

    function handleTrackSubscribed(track, publication, participant) {
      if (track.kind === "audio" && !participant.isLocal) {
        const mediaTrack = track.mediaStreamTrack;

        if (mediaTrack) {
          console.log("Agent TTS audio track received");
          onAgentAudioTrack(mediaTrack);
        }
      }
    }

    function handleStateChange(state) {
      console.log("Room state:", state);

      if (state === "connected") startMic();
      if (state === "reconnecting") onStatus("Reconnecting...");
      if (state === "disconnected") onStatus("Disconnected");
    }

    if (room.state === "connected") {
      startMic();
    }

    room.on("connectionStateChanged", handleStateChange);
    room.on("trackSubscribed", handleTrackSubscribed);

    return () => {
      mounted = false;
      room.off("connectionStateChanged", handleStateChange);
      room.off("trackSubscribed", handleTrackSubscribed);
    };
  }, [room, localParticipant, onStatus, onAgentAudioTrack]);

  return null;
}

// ================= BACKGROUND =================

function Background() {
  const { scene } = useThree();
  const texture = useLoader(THREE.TextureLoader, BACKGROUND_IMAGE);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
  }, [texture, scene]);

  return null;
}

// ================= AUDIO ANALYZER =================

function useAudioAnalyzer(track) {
  const analyserRef = useRef(null);
  const dataRef = useRef(null);
  const smoothVolumeRef = useRef(0);

  useEffect(() => {
    if (!track) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext({ latencyHint: "interactive" });

    const stream = new MediaStream([track]);
    const source = audioCtx.createMediaStreamSource(stream);

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.45;

    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    analyserRef.current = analyser;
    dataRef.current = data;
    smoothVolumeRef.current = 0;

    return () => {
      analyserRef.current = null;
      dataRef.current = null;
      audioCtx.close();
    };
  }, [track]);

  function getVolume() {
    const analyser = analyserRef.current;
    const data = dataRef.current;

    if (!analyser || !data) return 0;

    analyser.getByteFrequencyData(data);

    let sum = 0;

    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }

    const raw = sum / data.length / 255;
    const boosted = Math.min(raw * 8, 1);

    smoothVolumeRef.current =
      smoothVolumeRef.current * 0.6 + boosted * 0.4;

    return smoothVolumeRef.current;
  }

  return { getVolume };
}

// ================= SPOON MESH BUILDER =================

function buildSpoonMesh() {
  const spoonGroup = new THREE.Group();
  spoonGroup.name = "spoon_group";

  const makeMetal = () =>
    new THREE.MeshStandardMaterial({
      color: 0xd4d4d4,
      metalness: 0.95,
      roughness: 0.12,
      transparent: true,
      opacity: 1.0,
    });

  const handleGeo = new THREE.CylinderGeometry(0.013, 0.01, 0.28, 12);
  const handle = new THREE.Mesh(handleGeo, makeMetal());
  handle.position.set(0, -0.09, 0);
  handle.name = "spoon_handle";
  spoonGroup.add(handle);

  const neckGeo = new THREE.CylinderGeometry(0.015, 0.013, 0.05, 12);
  const neck = new THREE.Mesh(neckGeo, makeMetal());
  neck.position.set(0, 0.07, 0);
  neck.name = "spoon_neck";
  spoonGroup.add(neck);

  const bowlGeo = new THREE.SphereGeometry(0.048, 20, 14);
  const bowl = new THREE.Mesh(bowlGeo, makeMetal());
  bowl.scale.set(1.0, 0.4, 0.8);
  bowl.position.set(0, 0.125, 0);
  bowl.name = "spoon_bowl";
  spoonGroup.add(bowl);

  const innerBowlGeo = new THREE.SphereGeometry(0.046, 20, 14);
  const innerBowl = new THREE.Mesh(
    innerBowlGeo,
    new THREE.MeshStandardMaterial({
      color: 0xa8a8a8,
      metalness: 0.85,
      roughness: 0.2,
      side: THREE.BackSide,
      transparent: true,
      opacity: 1.0,
    })
  );

  innerBowl.scale.set(1.0, 0.38, 0.78);
  innerBowl.position.set(0, 0.126, 0);
  innerBowl.name = "spoon_inner_bowl";
  spoonGroup.add(innerBowl);

  spoonGroup.renderOrder = 0;

  return spoonGroup;
}

// ================= SPOON ATTACHED TO HAND =================

function SpoonAttached({ vrm, speakingRef, cookingZoneRef }) {
  const spoonRef = useRef(null);
  const raycaster = useRef(new THREE.Raycaster());
  const setMeshesRef = useRef([]);

  useEffect(() => {
    if (!vrm) return;

    const spoon = buildSpoonMesh();
    spoonRef.current = spoon;

    const rightHand = vrm.humanoid.getNormalizedBoneNode("rightHand");

    if (rightHand) {
      rightHand.add(spoon);

      spoon.position.set(0.02, -0.12, 0.06);

      spoon.rotation.set(
        THREE.MathUtils.degToRad(-170),
        THREE.MathUtils.degToRad(-90),
        THREE.MathUtils.degToRad(0)
      );

      spoon.scale.set(1.0, 1.0, 1.0);
    }

    const deg = (d) => d * (Math.PI / 180);

    const fingers = [
      "rightIndexProximal",
      "rightIndexIntermediate",
      "rightIndexDistal",
      "rightMiddleProximal",
      "rightMiddleIntermediate",
      "rightMiddleDistal",
      "rightRingProximal",
      "rightRingIntermediate",
      "rightRingDistal",
      "rightLittleProximal",
      "rightLittleIntermediate",
      "rightLittleDistal",
    ];

    fingers.forEach((boneName) => {
      const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
      if (!bone) return;

      if (boneName.includes("Proximal")) {
        bone.rotation.z = deg(65);
      } else if (boneName.includes("Intermediate")) {
        bone.rotation.z = deg(70);
      } else if (boneName.includes("Distal")) {
        bone.rotation.z = deg(55);
      }
    });

    const thumbM = vrm.humanoid.getNormalizedBoneNode("rightThumbMetacarpal");
    const thumbP = vrm.humanoid.getNormalizedBoneNode("rightThumbProximal");
    const thumbI = vrm.humanoid.getNormalizedBoneNode("rightThumbIntermediate");
    const thumbD = vrm.humanoid.getNormalizedBoneNode("rightThumbDistal");

    if (thumbM) {
      thumbM.rotation.y = deg(-20);
      thumbM.rotation.x = deg(10);
    }

    if (thumbP) {
      thumbP.rotation.y = deg(-25);
      thumbP.rotation.x = deg(15);
    }

    if (thumbI) {
      thumbI.rotation.x = deg(20);
    }

    if (thumbD) {
      thumbD.rotation.x = deg(15);
    }

    return () => {
      const rh = vrm.humanoid.getNormalizedBoneNode("rightHand");
      if (rh && spoon) rh.remove(spoon);
    };
  }, [vrm]);

  useFrame((state) => {
    if (!spoonRef.current) return;

    const t = state.clock.elapsedTime;

    const speakingAmount = speakingRef?.current || 0;
    const isInCookingZone = cookingZoneRef?.current || false;

    const isSpeaking = speakingAmount > 0.04;
    const shouldStir = isSpeaking && isInCookingZone;

    const baseX = THREE.MathUtils.degToRad(-170);
    const baseY = THREE.MathUtils.degToRad(-90);
    const baseZ = THREE.MathUtils.degToRad(0);

    if (shouldStir) {
      const stirSpeed = 3.0;
      const strength = THREE.MathUtils.clamp(speakingAmount, 0, 1);

      spoonRef.current.rotation.x =
        baseX + Math.sin(t * stirSpeed) * 0.12 * strength;

      spoonRef.current.rotation.y =
        baseY + Math.cos(t * stirSpeed) * 0.18 * strength;

      spoonRef.current.rotation.z =
        baseZ + Math.sin(t * stirSpeed + 0.5) * 0.1 * strength;
    } else {
      spoonRef.current.rotation.x = THREE.MathUtils.lerp(
        spoonRef.current.rotation.x,
        baseX,
        0.08
      );

      spoonRef.current.rotation.y = THREE.MathUtils.lerp(
        spoonRef.current.rotation.y,
        baseY,
        0.08
      );

      spoonRef.current.rotation.z = THREE.MathUtils.lerp(
        spoonRef.current.rotation.z,
        baseZ,
        0.08
      );
    }

    if (setMeshesRef.current.length === 0) {
      const found = [];

      state.scene.traverse((obj) => {
        if (obj.isMesh && obj.userData?.isSetModel) {
          found.push(obj);
        }
      });

      setMeshesRef.current = found;

      if (found.length === 0) return;
    }

    const camera = state.camera;
    const setMeshes = setMeshesRef.current;

    spoonRef.current.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const partWorldPos = new THREE.Vector3();
      child.getWorldPosition(partWorldPos);

      const dir = partWorldPos.clone().sub(camera.position).normalize();
      const distToPart = camera.position.distanceTo(partWorldPos);

      raycaster.current.set(camera.position, dir);
      raycaster.current.near = 0.01;
      raycaster.current.far = distToPart - 0.01;

      const hits = raycaster.current.intersectObjects(setMeshes, false);

      const isOccluded = hits.length > 0;
      const targetOpacity = isOccluded ? 0.15 : 1.0;

      child.material.transparent = true;
      child.material.depthWrite = !isOccluded;
      child.material.opacity = THREE.MathUtils.lerp(
        child.material.opacity,
        targetOpacity,
        0.18
      );
    });
  });

  return null;
}

// ================= HAT ATTACHED TO HEAD =================

function HatAttached({ vrm }) {
  const [hat, setHat] = useState(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();

    draco.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
    );

    loader.setDRACOLoader(draco);

    loader.load(
      HAT_MODEL,
      (gltf) => setHat(gltf.scene),
      undefined,
      (err) => console.error("Hat failed:", err)
    );
  }, []);

  useEffect(() => {
    if (!vrm || !hat) return;

    const head = vrm.humanoid.getNormalizedBoneNode("head");

    if (head) {
      head.add(hat);
      hat.rotation.set(0, 0, 0);
      hat.position.set(0.03, 0.3, 0);
      hat.scale.set(0.35, 0.15, 0.35);
    }

    return () => {
      const h = vrm.humanoid.getNormalizedBoneNode("head");
      if (h && hat) h.remove(hat);
    };
  }, [vrm, hat]);

  return null;
}

// ================= VRM AVATAR MODEL =================

function AvatarModel({ audioTrack, offsetX = 0 }) {
  const [vrm, setVrm] = useState(null);
  const { getVolume } = useAudioAnalyzer(audioTrack);

  const speakingRef = useRef(0);
  const cookingZoneRef = useRef(false);

  useEffect(() => {
    const loader = new GLTFLoader();

    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load("/a3.vrm", (gltf) => {
      const model = gltf.userData.vrm;
      if (!model) return;

      VRMUtils.rotateVRM0(model);

      model.scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.renderOrder = 0;
        }
      });

      setVrm(model);
    });
  }, []);

  useFrame((state, delta) => {
    if (!vrm) return;

    vrm.update(delta);

    const t = state.clock.elapsedTime;
    const cam = state.camera;

    vrm.scene.rotation.y = Math.atan2(
      cam.position.x - vrm.scene.position.x,
      cam.position.z - vrm.scene.position.z
    );

    const avatarX = vrm.scene.position.x;
    const avatarZ = vrm.scene.position.z;

    const isNearPan =
      avatarX > -1.2 &&
      avatarX < 1.2 &&
      avatarZ > -3.5 &&
      avatarZ < -1.2;

    cookingZoneRef.current = isNearPan;

    vrm.expressionManager?.setValue("blink", Math.sin(t * 2) > 0.97 ? 1 : 0);

    const rawVol = getVolume();
    const speakingAmount = rawVol > 0.025 ? Math.min(rawVol * 1.8, 1) : 0;

    speakingRef.current = speakingAmount;

    vrm.expressionManager?.setValue("aa", speakingAmount);
    vrm.expressionManager?.setValue("ih", speakingAmount * 0.35);
    vrm.expressionManager?.setValue("ou", speakingAmount * 0.25);

    const lUA = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
    const rUA = vrm.humanoid.getNormalizedBoneNode("rightUpperArm");
    const lLA = vrm.humanoid.getNormalizedBoneNode("leftLowerArm");
    const rLA = vrm.humanoid.getNormalizedBoneNode("rightLowerArm");
    const lH = vrm.humanoid.getNormalizedBoneNode("leftHand");
    const rH = vrm.humanoid.getNormalizedBoneNode("rightHand");

    const deg = (d) => d * (Math.PI / 180);

    if (lUA && rUA && lLA && rLA && lH && rH) {
      lUA.rotation.set(deg(125), deg(-60), deg(15));
      lLA.rotation.set(deg(-80), deg(-72), deg(0));
      lH.rotation.set(deg(40), deg(-30), deg(0));

      const speak = speakingRef.current;
      const isSpeaking = speak > 0.04;
      const isInCookingZone = cookingZoneRef.current;

      if (isSpeaking && isInCookingZone) {
        const stirX = Math.sin(t * 3.0) * speak;
        const stirZ = Math.cos(t * 3.0) * speak;

        rUA.rotation.x = deg(110) + stirX * deg(4);
        rUA.rotation.y = deg(45);
        rUA.rotation.z = deg(-60) + stirZ * deg(3);

        rLA.rotation.x = deg(-85) + stirX * deg(5);
        rLA.rotation.y = deg(35);
        rLA.rotation.z = deg(35) + stirZ * deg(4);

        rH.rotation.x = deg(40) + stirX * deg(8);
        rH.rotation.y = deg(10) + stirZ * deg(5);
        rH.rotation.z = stirX * deg(6);
      } else {
        rUA.rotation.x = THREE.MathUtils.lerp(rUA.rotation.x, deg(110), 0.08);
        rUA.rotation.y = THREE.MathUtils.lerp(rUA.rotation.y, deg(45), 0.08);
        rUA.rotation.z = THREE.MathUtils.lerp(rUA.rotation.z, deg(-60), 0.08);

        rLA.rotation.x = THREE.MathUtils.lerp(rLA.rotation.x, deg(-85), 0.08);
        rLA.rotation.y = THREE.MathUtils.lerp(rLA.rotation.y, deg(35), 0.08);
        rLA.rotation.z = THREE.MathUtils.lerp(rLA.rotation.z, deg(35), 0.08);

        rH.rotation.x = THREE.MathUtils.lerp(rH.rotation.x, deg(40), 0.08);
        rH.rotation.y = THREE.MathUtils.lerp(rH.rotation.y, deg(10), 0.08);
        rH.rotation.z = THREE.MathUtils.lerp(rH.rotation.z, deg(0), 0.08);
      }
    }
  });

  if (!vrm) return null;

  const scale = isMobile ? [1.25, 1.12, 1.25] : [2, 1.7, 2];
  const zPos = isMobile ? -2.6: -3.0;

  return (
    <>
      <primitive
        object={vrm.scene}
        position={[offsetX, AVATAR_GROUND_Y, zPos]}
        scale={scale}
      />

      <HatAttached vrm={vrm} />

      <SpoonAttached
        vrm={vrm}
        speakingRef={speakingRef}
        cookingZoneRef={cookingZoneRef}
      />
    </>
  );
}

// ================= SET MODEL =================

function SetModel() {
  const gltf = useLoader(GLTFLoader, SET_MODEL, (loader) => {
    const draco = new DRACOLoader();

    draco.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
    );

    loader.setDRACOLoader(draco);
  });

  useEffect(() => {
    gltf.scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.userData.isSetModel = true;

        obj.material = obj.material.clone();
        obj.material.transparent = false;
        obj.material.depthWrite = true;
        obj.material.depthTest = true;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [gltf]);

 return (
  <primitive
    object={gltf.scene}
    position={isMobile ? [0, -1.45, -1.9] : [0, -1.2, -1.6]}
    rotation={[0, -Math.PI / 2, 0]}
    scale={isMobile ? 0.38 : 0.44}
  />
);
}

// ================= MAIN AVATAR SCREEN =================

export default function AvatarScreen({ navigation }) {
  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [status, setStatus] = useState("Press Start");
  const [agentAudioTrack, setAgentAudioTrack] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const screenW = typeof window !== "undefined" ? window.innerWidth : 1280;

  const initX = isMobile ? screenW / 2 - DRAG_BOX_CENTER : 200;
  const initY = isMobile ? 100 : 50;

  const { pos, onMouseDown, onTouchStart } = useDrag({
    x: initX,
    y: initY,
  });

  const rawAvatarX = ((pos.x + DRAG_BOX_CENTER - screenW / 2) / screenW) * 12;
  const avatarOffsetX = clamp(rawAvatarX, AVATAR_MIN_X, AVATAR_MAX_X);

  async function start() {
    try {
      setIsConnecting(true);
      setStatus("Connecting...");

      const room = "zaikamate-room-" + Date.now();
      const identity = "user-" + Math.floor(Math.random() * 100000);

      const res = await fetch(
        `${BACKEND_URL}/get-livekit-token?room=${room}&identity=${identity}`
      );

      if (!res.ok) {
        throw new Error("Failed to get LiveKit token");
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setToken(data.token);
      setServerUrl(data.url);
      setStatus("Joining room...");
    } catch (err) {
      console.error("Connection error:", err);
      setStatus("Connection failed");
    } finally {
      setIsConnecting(false);
    }
  }

  
function stop() {
  setStatus("Stopping...");
  setIsConnecting(true);

  setToken(null);
  setServerUrl(null);
  setAgentAudioTrack(null);

  setTimeout(() => {
    setStatus("Stopped");
    setIsConnecting(false);
  }, 1000);
}
  function goBack() {
  if (token) stop();

  if (navigation?.navigate) {
    navigation.navigate("main");
  } else if (navigation?.goBack) {
    navigation.goBack();
  } else {
    window.location.href = "main";  // change "/" to your main screen route
  }
}

  return (
    <div className="avatar-web-page">
      <button className="avatar-back-button" onClick={goBack}>
        ← Back
      </button>

      <Canvas
        camera={{ position: [0, 0, 4], fov: isMobile ? 60 : 40 }}
        style={{ width: "100%", height: "100%" }}
        onCreated={({ gl }) => {
          gl.domElement.style.pointerEvents = "none";
        }}
      >
        <Background />

        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 4, 2]} intensity={1.5} />
        <pointLight position={[-1, 2, 2]} intensity={1.2} color={0xfff5e0} />

        <AvatarModel audioTrack={agentAudioTrack} offsetX={avatarOffsetX} />

        <SetModel />
      </Canvas>

      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: DRAG_BOX_WIDTH,
          height: DRAG_BOX_HEIGHT,
          cursor: "grab",
          zIndex: 8,
          background: "rgba(255, 255, 255, 0.01)",
          touchAction: "none",
        }}
      />

      {token && serverUrl && (
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          audio={false}
          video={false}
          onDisconnected={() => {
            setToken(null);
            setServerUrl(null);
            setAgentAudioTrack(null);
            setStatus("Disconnected");
          }}
        >
          <RoomAudioRenderer />

          <MicPublisher
            onStatus={setStatus}
            onAgentAudioTrack={setAgentAudioTrack}
          />
        </LiveKitRoom>
      )}

      <div className="avatar-status-box">{status}</div>

      <div className="avatar-start-button-wrapper">
        <button
          className="avatar-start-button"
          onClick={token ? stop : start}
          disabled={isConnecting}
        >
          {token ? "Stop" : isConnecting ? "Connecting..." : "Start"}
        </button>
      </div>
    </div>
  );
}