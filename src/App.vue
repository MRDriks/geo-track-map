<template>
  <div class="app">
    <div class="sidebar">
      <Panel header="Налаштування">
        <Vue3Dropzone v-model="files" ref="dropzone" :showSelectButton="false">
          <template #title>
            <h3 class="dropzone-title">Перетягніть файли сюди</h3>
          </template>
          <template #description>
            <p class="dropzone-description">
              Перетягніть файли сюди або натисніть, щоб вибрати
            </p>
          </template>
        </Vue3Dropzone>

        <div class="save-icon">
          <Button
            v-if="files.length"
            icon="pi pi-bookmark"
            severity="secondary"
            aria-label="Bookmark"
            @click="saveIcon"
          />
        </div>

        <div class="marker-icons">
          <Button
            v-for="(icon, index) in icons"
            :key="index"
            :variant="selectedIcon === index ? 'outlined' : 'text'"
            class="!border-2"
            width="32"
            height="32"
            @click="changeIcon(index)"
          >
            <img :src="icon.src" width="32" height="32" />
          </Button>
        </div>
      </Panel>
    </div>

    <div class="content">
      <Panel header="Мапа">
        <template #default>
          <GoogleMap
            api-key="AIzaSyDL9yegYAMfZbqGrc1UTLmMBZAF6yYK1Ug"
            map-id="bf8ba741171ce6ac515c5886"
            style="width: 100%; height: 500px"
            :center="center"
            :zoom="15"
            :options="mapOptions"
            @click="handleMapClick"
          >
            <AdvancedMarker
              v-for="(marker, index) in markers"
              :key="index"
              :options="{
                gmpDraggable: true,
                position: marker,
              }"
              @dragend="onMarkerDragEnd($event, index)"
              @click.left="handleMarkerLeftClick(index)"
              @click.right="handleMarkerRightClick(index)"
            >
              <template #content>
                <div
                  class="custom-marker"
                  :class="{ selected: selectedMarkerIndex === index }"
                >
                  <div
                    class="custom-marker-label"
                    @dblclick="editMarker(index)"
                    @mousedown="startRotation($event, index)"
                  >
                    {{ marker.label }}
                  </div>

                  <img
                    v-if="marker.url"
                    :src="marker.url"
                    :style="{ transform: `rotate(${marker.rotation}deg)` }"
                    class="custom-marker-icon"
                    width="32"
                    height="32"
                  />
                </div>
              </template>
            </AdvancedMarker>
          </GoogleMap>
        </template>
      </Panel>

      <Panel header="Дії з мітками">
        <div class="actions">
          <div class="actions-wrapper">
            <Button
              :label="activeMode === 'add' ? 'Скасувати' : 'Режим додавання'"
              :severity="activeMode === 'add' ? 'secondary' : 'success'"
              @click="
                activeMode === 'add'
                  ? (activeMode = null)
                  : (activeMode = 'add')
              "
            />

            <Button
              :label="activeMode === 'delete' ? 'Скасувати' : 'Режим видалення'"
              :severity="activeMode === 'delete' ? 'secondary' : 'danger'"
              @click="
                activeMode === 'delete'
                  ? (activeMode = null)
                  : (activeMode = 'delete')
              "
            />
          </div>

          <Button label="Очистити" severity="danger" @click="clearMarkers" />
        </div>
      </Panel>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { GoogleMap, AdvancedMarker } from "vue3-google-map";

import Panel from "primevue/panel";
import Button from "primevue/button";
import Popover from "primevue/popover";

const center = { lat: 50.450001, lng: 30.523333 };

const files = ref([]);
const icons = ref([]);
const dropzone = ref();
const markers = ref([]);
const activeMode = ref(null);
const markerCopy = ref(null);
const selectedIcon = ref(null);
const selectedMarkerIndex = ref(null);

const mapOptions = computed(() => ({
  draggable: true,
  disableDoubleClickZoom: false,
}));

const editMarker = (index) => {
  const newLabel = prompt(
    "Введіть нову назву мітки:",
    markers.value[index].label
  );
  if (newLabel !== null) {
    markers.value[index].label = newLabel;
  }
};

const removeMarker = (index) => {
  if (index !== null) {
    markers.value.splice(index, 1);
  }
};

const clearMarkers = () => {
  markers.value = [];
};

const handleMapClick = (event) => {
  if (activeMode.value !== "add" || selectedIcon.value === null) return;

  const { latLng } = event;

  if (markerCopy.value) {
    markers.value.push({
      ...markerCopy.value,
      lat: latLng.lat(),
      lng: latLng.lng(),
    });
  } else {
    markers.value.push({
      lat: latLng.lat(),
      lng: latLng.lng(),
      label: `Мітка ${markers.value.length + 1}`,
      url:
        selectedIcon.value !== null
          ? icons.value[selectedIcon.value].src
          : null,
      rotation: 0,
    });
  }
};

const handleMarkerLeftClick = (index) => {
  if (activeMode.value === "delete") {
    removeMarker(index);
  }
};

const handleMarkerRightClick = (index) => {
  selectedMarkerIndex.value = index;

  markerCopy.value = { ...markers.value[index] };

  setTimeout(() => {
    selectedMarkerIndex.value = null;
  }, 3000);
};

const saveIcon = () => {
  icons.value.push({ src: URL.createObjectURL(files.value[0].file) });

  dropzone.value.clearAll();
};

const changeIcon = (index) => {
  selectedIcon.value === index
    ? (selectedIcon.value = null)
    : (selectedIcon.value = index);

  markerCopy.value = null;
};

const onMarkerDragEnd = (event, index) => {
  const pos = event.latLng;
  if (!pos) return;
  markers.value[index].lat = pos.lat();
  markers.value[index].lng = pos.lng();
};

let rotating = null;

const startRotation = (e, index) => {
  e.preventDefault();
  e.stopPropagation();

  rotating = { index, startX: e.clientX, startY: e.clientY };

  window.addEventListener("mousemove", rotateMarker);
  window.addEventListener("mouseup", stopRotation);
};

const rotateMarker = (e) => {
  if (!rotating) return;

  const marker = markers.value[rotating.index];
  const dx = e.clientX - rotating.startX;
  const dy = e.clientY - rotating.startY;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  marker.rotation = (angle + 360) % 360;
};

const stopRotation = () => {
  rotating = null;

  window.removeEventListener("mousemove", rotateMarker);
  window.removeEventListener("mouseup", stopRotation);
};
</script>

<style scoped>
.app {
  display: flex;
  column-gap: 24px;
}

.sidebar {
  width: 30%;
  height: 100%;
}

.content {
  width: 70%;
  display: flex;
  flex-direction: column;
  row-gap: 16px;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.actions-wrapper {
  display: flex;
  gap: 8px;
}

.save-icon {
  margin: 16px 0;
  display: flex;
  justify-content: center;
}

.marker-icons {
  display: flex;
  gap: 8px;
}

.dropzone-title {
  margin: 8px 0;
}

.dropzone-description {
  margin: 0;
  font-size: 12px;
  color: #bebfc3;
}
</style>
