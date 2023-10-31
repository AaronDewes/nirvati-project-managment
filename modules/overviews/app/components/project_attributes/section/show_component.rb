#-- copyright
# OpenProject is an open source project management software.
# Copyright (C) 2012-2023 the OpenProject GmbH
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License version 3.
#
# OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
# Copyright (C) 2006-2013 Jean-Philippe Lang
# Copyright (C) 2010-2013 the ChiliProject Team
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU General Public License
# as published by the Free Software Foundation; either version 2
# of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
#
# See COPYRIGHT and LICENSE files for more details.
#++

module ProjectAttributes
  module Section
    class ShowComponent < ApplicationComponent
      include ApplicationHelper
      include OpPrimer::ComponentHelpers
      include OpTurbo::Streamable

      def initialize(project:, project_custom_field_section:)
        super

        @project = project
        @project_custom_field_section = project_custom_field_section
      end

      private

      def project_custom_field_values
        active_custom_field_ids_of_project = ProjectCustomFieldProjectMapping
          .where(project_id: @project.id)
          .pluck(:custom_field_id)

        CustomValue.where(custom_field_id: active_custom_field_ids_of_project, customized_id: @project.id)
      end

      def project_custom_field_values_of_section
        project_custom_field_values.select do |cfv|
          @project_custom_field_section.project_custom_fields.pluck(:id).include?(cfv.custom_field_id)
        end
      end
    end
  end
end
